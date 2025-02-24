/*
  # Add Quiz Schema with Code Generation

  1. New Columns
    - Add quiz_code column to quizzes table
    - Add questions jsonb column to quizzes table
  
  2. Functions
    - Create function to generate unique 6-digit codes
    - Add trigger for automatic code generation
    - Add validation for quiz questions

  3. Indexes
    - Create index on quiz_code for faster lookups
*/

-- Add quiz code and question fields to quizzes table
ALTER TABLE quizzes
ADD COLUMN quiz_code text UNIQUE,
ADD COLUMN questions jsonb;

-- Create index for quiz code lookups
CREATE INDEX idx_quizzes_quiz_code ON quizzes(quiz_code);

-- Create function to generate unique quiz code
CREATE OR REPLACE FUNCTION generate_quiz_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate a random 6-digit code
    v_code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
    
    -- Check if code exists
    SELECT EXISTS (
      SELECT 1 FROM quizzes WHERE quiz_code = v_code
    ) INTO v_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Create trigger to automatically generate quiz code
CREATE OR REPLACE FUNCTION trigger_generate_quiz_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quiz_code IS NULL THEN
    NEW.quiz_code := generate_quiz_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_generate_quiz_code
  BEFORE INSERT ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_quiz_code();

-- Add validation for quiz questions
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
      IF NOT (question->>'type' IN ('multiple-choice', 'true-false', 'open-ended', 'fill-in-blank')) THEN
        RAISE EXCEPTION 'Invalid question type for question %: %', i + 1, question->>'type';
      END IF;

      -- Validate multiple choice options
      IF question->>'type' = 'multiple-choice' AND (
        NOT (question ? 'options') OR
        jsonb_array_length(question->'options') < 2 OR
        jsonb_array_length(question->'options') > 6
      ) THEN
        RAISE EXCEPTION 'Multiple choice question % must have 2-6 options', i + 1;
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

CREATE TRIGGER tr_validate_quiz_questions
  BEFORE INSERT OR UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION validate_quiz_questions();
