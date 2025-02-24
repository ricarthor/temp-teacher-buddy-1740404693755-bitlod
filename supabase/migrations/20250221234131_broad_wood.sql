-- Create function to save quiz answers
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

-- Create function to save multiple answers at once
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
BEGIN
  -- Process each answer
  FOR v_answer IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    -- Save individual answer
    SELECT save_quiz_answer(
      p_student_id,
      p_quiz_id,
      (v_answer->>'question_id')::uuid,
      v_answer->>'selected_answer'
    ) INTO v_result;

    -- Append result to results array
    v_results := v_results || v_result;
  END LOOP;

  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'quiz_id', p_quiz_id,
    'answers', v_results
  );
END;
$$;

-- Create function to get student's quiz answers
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
BEGIN
  -- Get all answers for this student and quiz
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
  AND quiz_id = p_quiz_id;

  RETURN jsonb_build_object(
    'student_id', p_student_id,
    'quiz_id', p_quiz_id,
    'answers', COALESCE(v_answers, '[]'::jsonb),
    'score', COALESCE(v_score, 0),
    'submitted_at', (
      SELECT MAX(created_at)
      FROM quiz_answers
      WHERE student_id = p_student_id
      AND quiz_id = p_quiz_id
    )
  );
END;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quiz_answers_student_quiz 
  ON quiz_answers(student_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_question 
  ON quiz_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_created_at 
  ON quiz_answers(created_at);
