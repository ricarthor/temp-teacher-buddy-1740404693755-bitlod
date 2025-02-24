-- Drop and recreate the save_quiz_answer function with fixed parameter handling
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
BEGIN
  -- Get correct answer from teacher_quizzes table
  SELECT 
    q->>'correct_answer' INTO v_correct_answer
  FROM teacher_quizzes,
  jsonb_array_elements(questions) q
  WHERE id = p_quiz_id
  AND (q->>'id')::uuid = p_question_id;

  IF v_correct_answer IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  -- Compare selected answer with correct answer
  v_is_correct := TRIM(BOTH '"' FROM p_selected_answer::text) = TRIM(BOTH '"' FROM v_correct_answer::text);

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
    'is_correct', is_correct
  ) INTO v_result;

  RETURN v_result;
END;
$$;
