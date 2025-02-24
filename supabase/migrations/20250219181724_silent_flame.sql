-- Add code-interpretation to question type check constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_type_check;
ALTER TABLE questions ADD CONSTRAINT questions_type_check 
  CHECK (type IN ('multiple-choice', 'true-false', 'code-interpretation'));

-- Add new columns for code interpretation questions
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS code_language text,
ADD COLUMN IF NOT EXISTS code_snippet text;

-- Update quiz validation function to support code interpretation
CREATE OR REPLACE FUNCTION validate_quiz_questions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate questions array
  IF NEW.questions IS NULL OR jsonb_array_length(NEW.questions) = 0 THEN
    RAISE EXCEPTION 'Quiz must have at least one question';
  END IF;

  -- Validate each question
  FOR i IN 0..jsonb_array_length(NEW.questions) - 1 LOOP
    DECLARE
      question jsonb := NEW.questions->i;
    BEGIN
      -- Check required fields
      IF NOT (
        question ? 'text' AND
        question ? 'type' AND
        question ? 'correct_answer'
      ) THEN
        RAISE EXCEPTION 'Question % is missing required fields', i + 1;
      END IF;

      -- Validate question type
      IF NOT (question->>'type' IN ('multiple-choice', 'true-false', 'code-interpretation')) THEN
        RAISE EXCEPTION 'Invalid question type for question %: %', i + 1, question->>'type';
      END IF;

      -- Validate multiple choice options
      IF (question->>'type' IN ('multiple-choice', 'code-interpretation')) AND (
        NOT (question ? 'options') OR
        jsonb_array_length(question->'options') < 2 OR
        jsonb_array_length(question->'options') > 6
      ) THEN
        RAISE EXCEPTION 'Multiple choice question % must have 2-6 options', i + 1;
      END IF;

      -- Validate code interpretation specific fields
      IF question->>'type' = 'code-interpretation' AND (
        NOT (question ? 'code_language') OR
        NOT (question ? 'code_snippet')
      ) THEN
        RAISE EXCEPTION 'Code interpretation question % must have code_language and code_snippet', i + 1;
      END IF;

      -- Validate true/false answers
      IF question->>'type' = 'true-false' AND NOT (
        question->>'correct_answer' IN ('true', 'false')
      ) THEN
        RAISE EXCEPTION 'True/false question % must have true or false as answer', i + 1;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;
