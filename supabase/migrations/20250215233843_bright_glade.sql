-- Drop and recreate the import_quiz_answers function
CREATE OR REPLACE FUNCTION import_quiz_answers(
  p_quiz_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  answer_record jsonb;
  v_result jsonb := '[]'::jsonb;
  v_error text;
  v_course_id uuid;
BEGIN
  -- Get the course_id for the quiz
  SELECT course_id INTO v_course_id
  FROM quizzes
  WHERE id = p_quiz_id;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'Quiz with ID % not found', p_quiz_id;
  END IF;

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
        AND cs.course_id = v_course_id
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
        p_quiz_id,
        (answer_record->>'question_id')::uuid,
        answer_record->>'selected_answer',
        (answer_record->>'is_correct')::boolean,
        COALESCE((answer_record->>'created_at')::timestamptz, now())
      )
      ON CONFLICT (student_id, quiz_id, question_id) 
      DO UPDATE SET
        selected_answer = EXCLUDED.selected_answer,
        is_correct = EXCLUDED.is_correct,
        created_at = EXCLUDED.created_at;

      -- Add successful import to result
      v_result := v_result || jsonb_build_object(
        'student_id', answer_record->>'student_id',
        'question_id', answer_record->>'question_id',
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next answer
      v_error := SQLERRM;
      v_result := v_result || jsonb_build_object(
        'student_id', answer_record->>'student_id',
        'question_id', answer_record->>'question_id',
        'status', 'error',
        'error', v_error
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'imported_answers', v_result
  );
END;
$$;
