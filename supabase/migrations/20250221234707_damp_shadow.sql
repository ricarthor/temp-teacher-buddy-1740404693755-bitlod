-- Drop and recreate the save_quiz_answer function with improved error handling
CREATE OR REPLACE FUNCTION save_quiz_answer(
  p_student_id text,
  p_quiz_id uuid,
  p_question_id uuid,
  p_selected_answer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_correct_answer text;
  v_is_correct boolean;
  v_result jsonb;
  v_question jsonb;
BEGIN
  -- Validate input parameters
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'Student ID is required';
  END IF;

  IF p_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ID is required';
  END IF;

  IF p_question_id IS NULL THEN
    RAISE EXCEPTION 'Question ID is required';
  END IF;

  IF p_selected_answer IS NULL THEN
    RAISE EXCEPTION 'Selected answer is required';
  END IF;

  -- Get question data from teacher_quizzes table
  SELECT q INTO v_question
  FROM teacher_quizzes,
  jsonb_array_elements(questions) q
  WHERE id = p_quiz_id
  AND (q->>'id')::uuid = p_question_id;

  IF v_question IS NULL THEN
    RAISE EXCEPTION 'Question not found in quiz';
  END IF;

  -- Get correct answer
  v_correct_answer := v_question->>'correct_answer';
  IF v_correct_answer IS NULL THEN
    RAISE EXCEPTION 'Question has no correct answer defined';
  END IF;

  -- Compare selected answer with correct answer (case-insensitive)
  v_is_correct := LOWER(TRIM(BOTH '"' FROM p_selected_answer::text)) = 
                  LOWER(TRIM(BOTH '"' FROM v_correct_answer::text));

  -- Insert or update answer
  INSERT INTO quiz_answers (
    student_id,
    quiz_id,
    question_id,
    selected_answer,
    is_correct
  )
  VALUES (
    p_student_id,
    p_quiz_id,
    p_question_id,
    p_selected_answer,
    v_is_correct
  )
  ON CONFLICT (student_id, quiz_id, question_id) 
  DO UPDATE SET
    selected_answer = EXCLUDED.selected_answer,
    is_correct = EXCLUDED.is_correct,
    created_at = now()
  RETURNING jsonb_build_object(
    'answer_id', id,
    'is_correct', is_correct,
    'question_id', question_id
  ) INTO v_result;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Log error details and return error response
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'detail', SQLSTATE,
    'params', jsonb_build_object(
      'student_id', p_student_id,
      'quiz_id', p_quiz_id,
      'question_id', p_question_id
    )
  );
END;
$$;

-- Drop and recreate the save_quiz_answers function with improved error handling
CREATE OR REPLACE FUNCTION save_quiz_answers(
  p_student_id text,
  p_quiz_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_answer jsonb;
  v_results jsonb := '[]'::jsonb;
  v_result jsonb;
  v_error_count integer := 0;
BEGIN
  -- Validate input parameters
  IF p_student_id IS NULL THEN
    RAISE EXCEPTION 'Student ID is required';
  END IF;

  IF p_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ID is required';
  END IF;

  IF p_answers IS NULL OR jsonb_array_length(p_answers) = 0 THEN
    RAISE EXCEPTION 'Answers array is required and must not be empty';
  END IF;

  -- Process each answer
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    BEGIN
      -- Validate answer structure
      IF NOT (v_answer ? 'question_id' AND v_answer ? 'selected_answer') THEN
        RAISE EXCEPTION 'Invalid answer format: missing required fields';
      END IF;

      -- Save individual answer
      SELECT save_quiz_answer(
        p_student_id,
        p_quiz_id,
        (v_answer->>'question_id')::uuid,
        v_answer->>'selected_answer'
      ) INTO v_result;

      -- Check if the save operation returned an error
      IF (v_result->>'error') IS NOT NULL THEN
        v_error_count := v_error_count + 1;
      END IF;

      -- Append result to results array
      v_results := v_results || v_result;
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next answer
      v_error_count := v_error_count + 1;
      v_results := v_results || jsonb_build_object(
        'error', SQLERRM,
        'detail', SQLSTATE,
        'answer', v_answer
      );
    END;
  END LOOP;

  -- Return results with summary
  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'quiz_id', p_quiz_id,
    'total_answers', jsonb_array_length(p_answers),
    'error_count', v_error_count,
    'answers', v_results
  );
END;
$$;
