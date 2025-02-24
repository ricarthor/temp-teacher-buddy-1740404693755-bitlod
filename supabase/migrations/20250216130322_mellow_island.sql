-- Drop and recreate the import_quiz_answers function to use the provided is_correct flag
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
  v_question record;
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
      -- Get the question to verify it exists
      SELECT id INTO v_question
      FROM questions
      WHERE id = (answer_record->>'question_id')::uuid
      AND quiz_id = p_quiz_id;

      IF v_question.id IS NULL THEN
        RAISE EXCEPTION 'Question with ID % not found', answer_record->>'question_id';
      END IF;

      -- Log the answer being processed
      RAISE NOTICE 'Processing answer: student=%, question=%, answer=%, is_correct=%',
        answer_record->>'student_id',
        answer_record->>'question_id',
        answer_record->>'selected_answer',
        answer_record->>'is_correct';

      -- Insert answer using the provided is_correct flag
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
        v_question.id,
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
        'status', 'success',
        'is_correct', (answer_record->>'is_correct')::boolean
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next answer
      GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
      RAISE NOTICE 'Error processing answer: %', v_error;
      
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
