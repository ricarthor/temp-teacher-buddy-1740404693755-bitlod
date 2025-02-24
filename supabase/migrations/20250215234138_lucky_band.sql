-- Create function to import quiz with questions and answers
CREATE OR REPLACE FUNCTION import_quiz_with_answers(
  p_course_id uuid,
  p_quiz_title text,
  p_quiz_topic text,
  p_quiz_description text,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id uuid;
  answer_record jsonb;
  v_result jsonb := '[]'::jsonb;
  v_error text;
  v_questions jsonb;
  v_question record;
BEGIN
  -- Create quiz
  INSERT INTO quizzes (
    course_id,
    title,
    topic,
    description,
    status,
    due_date
  ) VALUES (
    p_course_id,
    p_quiz_title,
    p_quiz_topic,
    p_quiz_description,
    'completed',
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_quiz_id;

  -- Get unique questions from answers
  WITH unique_questions AS (
    SELECT DISTINCT 
      q->>'question_id' as id,
      first_value(q->>'text') OVER (PARTITION BY q->>'question_id' ORDER BY q->>'created_at' DESC) as text,
      first_value(q->>'type') OVER (PARTITION BY q->>'question_id' ORDER BY q->>'created_at' DESC) as type,
      first_value(q->>'correct_answer') OVER (PARTITION BY q->>'question_id' ORDER BY q->>'created_at' DESC) as correct_answer
    FROM jsonb_array_elements(p_answers) a
    CROSS JOIN jsonb_array_elements(a->'questions') q
  )
  SELECT jsonb_agg(to_jsonb(q)) INTO v_questions
  FROM unique_questions q;

  -- Create questions
  FOR v_question IN 
    SELECT 
      (value->>'text')::text as text,
      (value->>'type')::text as type,
      (value->>'correct_answer')::text as correct_answer
    FROM jsonb_array_elements(v_questions) as value
  LOOP
    INSERT INTO questions (
      quiz_id,
      text,
      type,
      correct_answer
    ) VALUES (
      v_quiz_id,
      v_question.text,
      v_question.type,
      v_question.correct_answer
    );
  END LOOP;

  -- Process each answer
  FOR answer_record IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    BEGIN
      -- Verify student exists and is enrolled in the course
      IF NOT EXISTS (
        SELECT 1 
        FROM students s
        JOIN course_students cs ON cs.student_id = s.id
        WHERE s.student_id = (answer_record->>'student_id')
        AND cs.course_id = p_course_id
      ) THEN
        RAISE EXCEPTION 'Student with ID % not found or not enrolled in the course', answer_record->>'student_id';
      END IF;

      -- Insert answer
      INSERT INTO quiz_answers (
        student_id,
        quiz_id,
        question_id,
        selected_answer,
        is_correct,
        created_at
      )
      VALUES (
        answer_record->>'student_id',
        v_quiz_id,
        (answer_record->>'question_id')::uuid,
        answer_record->>'selected_answer',
        (answer_record->>'is_correct')::boolean,
        COALESCE((answer_record->>'created_at')::timestamptz, now())
      );

      -- Add successful import to result
      v_result := v_result || jsonb_build_object(
        'student_id', answer_record->>'student_id',
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next answer
      v_error := SQLERRM;
      v_result := v_result || jsonb_build_object(
        'student_id', answer_record->>'student_id',
        'status', 'error',
        'error', v_error
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id,
    'imported_answers', v_result
  );
END;
$$;
