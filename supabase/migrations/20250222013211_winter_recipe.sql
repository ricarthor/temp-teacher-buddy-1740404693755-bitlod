-- Drop unique constraint from quiz_answers to allow multiple attempts
ALTER TABLE quiz_answers
DROP CONSTRAINT IF EXISTS quiz_answers_student_id_quiz_id_question_id_key;

-- Create a new index for performance
CREATE INDEX IF NOT EXISTS idx_quiz_answers_student_quiz_question 
ON quiz_answers(student_id, quiz_id, question_id);

-- Update quiz_answers table to track attempt number
ALTER TABLE quiz_answers
ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;

-- Create function to get latest attempt number
CREATE OR REPLACE FUNCTION get_next_attempt_number(
  p_student_id text,
  p_quiz_id uuid
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_attempt integer;
BEGIN
  SELECT COALESCE(MAX(attempt_number), 0) + 1
  INTO v_max_attempt
  FROM quiz_answers
  WHERE student_id = p_student_id
  AND quiz_id = p_quiz_id;
  
  RETURN v_max_attempt;
END;
$$;

-- Update save_quiz_answer function to handle multiple attempts
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
  v_attempt_number integer;
BEGIN
  -- Get next attempt number
  SELECT get_next_attempt_number(p_student_id, p_quiz_id)
  INTO v_attempt_number;

  -- Get question data from teacher_quizzes table
  SELECT q INTO v_question
  FROM teacher_quizzes,
  jsonb_array_elements(questions) q
  WHERE id = p_quiz_id
  AND (q->>'question_id')::uuid = p_question_id;

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

  -- Insert new answer with attempt number
  INSERT INTO quiz_answers (
    student_id,
    quiz_id,
    question_id,
    selected_answer,
    is_correct,
    attempt_number
  )
  VALUES (
    p_student_id,
    p_quiz_id,
    p_question_id,
    p_selected_answer,
    v_is_correct,
    v_attempt_number
  )
  RETURNING jsonb_build_object(
    'answer_id', id,
    'is_correct', is_correct,
    'question_id', question_id,
    'attempt_number', attempt_number
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Update get_student_quiz_answers function to return latest attempt
CREATE OR REPLACE FUNCTION get_student_quiz_answers(
  p_student_id text,
  p_quiz_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_answers jsonb;
  v_score numeric;
  v_attempt_number integer;
BEGIN
  -- Get the latest attempt number
  SELECT MAX(attempt_number)
  INTO v_attempt_number
  FROM quiz_answers
  WHERE student_id = p_student_id
  AND quiz_id = p_quiz_id;

  -- Get answers for the latest attempt
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'question_id', question_id,
        'selected_answer', selected_answer,
        'is_correct', is_correct,
        'submitted_at', created_at
      )
      ORDER BY created_at
    ),
    ROUND(
      (COUNT(*) FILTER (WHERE is_correct)::numeric / COUNT(*)::numeric * 100),
      2
    )
  INTO v_answers, v_score
  FROM quiz_answers
  WHERE student_id = p_student_id
  AND quiz_id = p_quiz_id
  AND attempt_number = v_attempt_number;

  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'quiz_id', p_quiz_id,
    'answers', COALESCE(v_answers, '[]'::jsonb),
    'score', COALESCE(v_score, 0),
    'attempt_number', v_attempt_number,
    'submitted_at', (
      SELECT MAX(created_at)
      FROM quiz_answers
      WHERE student_id = p_student_id
      AND quiz_id = p_quiz_id
      AND attempt_number = v_attempt_number
    )
  );
END;
$$;
