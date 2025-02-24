-- Add code-specific fields to questions table
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS code_language text,
ADD COLUMN IF NOT EXISTS code_snippet text;

-- Create function to handle quiz and questions creation
CREATE OR REPLACE FUNCTION create_quiz_with_questions(
  p_title text,
  p_topic text,
  p_description text,
  p_questions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id uuid;
  v_question jsonb;
  v_result jsonb;
BEGIN
  -- Create quiz in teacher_quizzes
  INSERT INTO teacher_quizzes (
    title,
    topic,
    description,
    questions,
    status
  ) VALUES (
    p_title,
    p_topic,
    p_description,
    p_questions,
    'draft'
  )
  RETURNING id INTO v_quiz_id;

  -- Process each question
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Insert question with all fields
    INSERT INTO questions (
      id,
      quiz_id,
      text,
      type,
      options,
      correct_answer,
      code_language,
      code_snippet
    ) VALUES (
      COALESCE((v_question->>'id')::uuid, gen_random_uuid()),
      v_quiz_id,
      v_question->>'text',
      v_question->>'type',
      CASE 
        WHEN v_question ? 'options' THEN v_question->'options'
        ELSE NULL
      END,
      v_question->>'correct_answer',
      CASE 
        WHEN v_question->>'type' = 'code-interpretation' THEN v_question->>'code_language'
        ELSE NULL
      END,
      CASE 
        WHEN v_question->>'type' = 'code-interpretation' THEN v_question->>'code_snippet'
        ELSE NULL
      END
    );
  END LOOP;

  -- Return created quiz ID and question count
  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id,
    'question_count', jsonb_array_length(p_questions)
  );
END;
$$;

-- Create function to update quiz and questions
CREATE OR REPLACE FUNCTION update_quiz_with_questions(
  p_quiz_id uuid,
  p_title text,
  p_topic text,
  p_description text,
  p_questions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question jsonb;
  v_result jsonb;
BEGIN
  -- Update quiz in teacher_quizzes
  UPDATE teacher_quizzes SET
    title = p_title,
    topic = p_topic,
    description = p_description,
    questions = p_questions,
    updated_at = now()
  WHERE id = p_quiz_id;

  -- Delete existing questions
  DELETE FROM questions WHERE quiz_id = p_quiz_id;

  -- Process each question
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Insert question with all fields
    INSERT INTO questions (
      id,
      quiz_id,
      text,
      type,
      options,
      correct_answer,
      code_language,
      code_snippet
    ) VALUES (
      COALESCE((v_question->>'id')::uuid, gen_random_uuid()),
      p_quiz_id,
      v_question->>'text',
      v_question->>'type',
      CASE 
        WHEN v_question ? 'options' THEN v_question->'options'
        ELSE NULL
      END,
      v_question->>'correct_answer',
      CASE 
        WHEN v_question->>'type' = 'code-interpretation' THEN v_question->>'code_language'
        ELSE NULL
      END,
      CASE 
        WHEN v_question->>'type' = 'code-interpretation' THEN v_question->>'code_snippet'
        ELSE NULL
      END
    );
  END LOOP;

  -- Return updated quiz ID and question count
  RETURN jsonb_build_object(
    'quiz_id', p_quiz_id,
    'question_count', jsonb_array_length(p_questions)
  );
END;
$$;

-- Add RLS policies for questions
CREATE POLICY "Allow quiz owners to manage questions"
  ON questions
  USING (
    EXISTS (
      SELECT 1 FROM teacher_quizzes
      WHERE id = quiz_id
      AND creator_id = auth.uid()
    )
  );
