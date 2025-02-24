-- Drop and recreate the validation function to make questions optional
CREATE OR REPLACE FUNCTION validate_teacher_quiz_questions()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip validation if questions array is empty or null
  IF NEW.questions IS NULL THEN
    NEW.questions := '[]'::jsonb;
    RETURN NEW;
  END IF;

  -- Skip validation if questions array is empty
  IF jsonb_array_length(NEW.questions) = 0 THEN
    RETURN NEW;
  END IF;

  -- Validate each question if present
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

      -- Validate multiple choice and code interpretation options
      IF (question->>'type' IN ('multiple-choice', 'code-interpretation')) AND (
        NOT (question ? 'options') OR
        jsonb_array_length(question->'options') < 2 OR
        jsonb_array_length(question->'options') > 6
      ) THEN
        RAISE EXCEPTION 'Multiple choice/code interpretation question % must have 2-6 options', i + 1;
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
