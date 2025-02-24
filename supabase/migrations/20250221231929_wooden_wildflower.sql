-- Create function to get quiz with questions
CREATE OR REPLACE FUNCTION get_quiz_with_questions(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz record;
  v_questions jsonb;
BEGIN
  -- Get quiz data
  SELECT 
    tq.id,
    tq.title,
    tq.topic,
    tq.description,
    tq.status,
    tq.code,
    tq.created_at,
    tq.updated_at
  INTO v_quiz
  FROM teacher_quizzes tq
  WHERE tq.id = p_quiz_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Quiz not found');
  END IF;

  -- Get questions with all fields
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'text', q.text,
      'type', q.type,
      'options', q.options,
      'correct_answer', q.correct_answer,
      'code_language', q.code_language,
      'code_snippet', q.code_snippet
    )
    ORDER BY q.created_at
  )
  FROM questions q
  WHERE q.quiz_id = p_quiz_id
  INTO v_questions;

  -- Return combined data
  RETURN jsonb_build_object(
    'quiz', jsonb_build_object(
      'id', v_quiz.id,
      'title', v_quiz.title,
      'topic', v_quiz.topic,
      'description', v_quiz.description,
      'status', v_quiz.status,
      'code', v_quiz.code,
      'created_at', v_quiz.created_at,
      'updated_at', v_quiz.updated_at
    ),
    'questions', COALESCE(v_questions, '[]'::jsonb)
  );
END;
$$;

-- Create function to validate quiz questions
CREATE OR REPLACE FUNCTION validate_quiz_questions(p_questions jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_question jsonb;
BEGIN
  -- Check if questions array is valid
  IF NOT jsonb_typeof(p_questions) = 'array' THEN
    RAISE EXCEPTION 'Questions must be an array';
  END IF;

  -- Validate each question
  FOR v_question IN SELECT * FROM jsonb_array_elements(p_questions)
  LOOP
    -- Check required fields
    IF NOT (
      v_question ? 'text' AND
      v_question ? 'type' AND
      v_question ? 'correct_answer'
    ) THEN
      RAISE EXCEPTION 'Question missing required fields';
    END IF;

    -- Validate question type
    IF NOT (v_question->>'type' IN ('multiple-choice', 'true-false', 'code-interpretation')) THEN
      RAISE EXCEPTION 'Invalid question type: %', v_question->>'type';
    END IF;

    -- Validate multiple choice options
    IF (v_question->>'type' IN ('multiple-choice', 'code-interpretation')) THEN
      IF NOT (v_question ? 'options') OR jsonb_array_length(v_question->'options') < 2 THEN
        RAISE EXCEPTION 'Multiple choice/code questions must have at least 2 options';
      END IF;
    END IF;

    -- Validate code interpretation fields
    IF v_question->>'type' = 'code-interpretation' THEN
      IF NOT (v_question ? 'code_language' AND v_question ? 'code_snippet') THEN
        RAISE EXCEPTION 'Code interpretation questions must have language and snippet';
      END IF;
    END IF;
  END LOOP;

  RETURN true;
END;
$$;

-- Add trigger for question validation
CREATE OR REPLACE FUNCTION trigger_validate_quiz_questions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_quiz_questions(NEW.questions);
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_validate_quiz_questions
  BEFORE INSERT OR UPDATE ON teacher_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_quiz_questions();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_type ON questions(type);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
