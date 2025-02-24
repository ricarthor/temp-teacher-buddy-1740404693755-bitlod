-- Create function to handle quiz creation with proper question handling
CREATE OR REPLACE FUNCTION create_teacher_quiz(
  p_title text,
  p_topic text,
  p_description text,
  p_questions jsonb DEFAULT '[]'::jsonb
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
    -- Generate UUID for question if not provided
    IF NOT (v_question ? 'id') THEN
      v_question := jsonb_set(
        v_question,
        '{id}',
        to_jsonb(gen_random_uuid()::text)
      );
    END IF;

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
      (v_question->>'id')::uuid,
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

  -- Return created quiz data
  SELECT jsonb_build_object(
    'quiz_id', v_quiz_id,
    'code', tq.code,
    'question_count', jsonb_array_length(p_questions)
  )
  FROM teacher_quizzes tq
  WHERE tq.id = v_quiz_id
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Create function to handle quiz updates with proper question handling
CREATE OR REPLACE FUNCTION update_teacher_quiz(
  p_quiz_id uuid,
  p_title text,
  p_topic text,
  p_description text,
  p_questions jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question jsonb;
  v_result jsonb;
  v_existing_questions jsonb;
BEGIN
  -- Get existing questions if not updating questions
  IF p_questions IS NULL THEN
    SELECT questions FROM teacher_quizzes
    WHERE id = p_quiz_id
    INTO v_existing_questions;
    
    p_questions := COALESCE(v_existing_questions, '[]'::jsonb);
  END IF;

  -- Update quiz in teacher_quizzes
  UPDATE teacher_quizzes SET
    title = COALESCE(p_title, title),
    topic = COALESCE(p_topic, topic),
    description = COALESCE(p_description, description),
    questions = p_questions,
    updated_at = now()
  WHERE id = p_quiz_id;

  -- Delete existing questions
  DELETE FROM questions WHERE quiz_id = p_quiz_id;

  -- Process each question
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Generate UUID for question if not provided
    IF NOT (v_question ? 'id') THEN
      v_question := jsonb_set(
        v_question,
        '{id}',
        to_jsonb(gen_random_uuid()::text)
      );
    END IF;

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
      (v_question->>'id')::uuid,
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

  -- Return updated quiz data
  SELECT jsonb_build_object(
    'quiz_id', p_quiz_id,
    'question_count', jsonb_array_length(p_questions)
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Create function to delete quiz and its questions
CREATE OR REPLACE FUNCTION delete_teacher_quiz(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  -- Delete quiz and get count of deleted questions
  WITH deleted_questions AS (
    DELETE FROM questions
    WHERE quiz_id = p_quiz_id
    RETURNING id
  ),
  deleted_quiz AS (
    DELETE FROM teacher_quizzes
    WHERE id = p_quiz_id
    RETURNING id
  )
  SELECT COUNT(*) FROM deleted_questions INTO v_deleted_count;

  RETURN jsonb_build_object(
    'quiz_id', p_quiz_id,
    'deleted_questions', v_deleted_count
  );
END;
$$;
