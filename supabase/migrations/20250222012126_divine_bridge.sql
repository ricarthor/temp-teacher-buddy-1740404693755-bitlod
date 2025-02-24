-- Add feedback column to teacher_quizzes table
ALTER TABLE teacher_quizzes
ADD COLUMN IF NOT EXISTS feedback jsonb DEFAULT '[]'::jsonb;

-- Create index for better performance when querying feedback
CREATE INDEX IF NOT EXISTS idx_teacher_quizzes_feedback ON teacher_quizzes USING gin(feedback);

-- Add validation trigger for feedback structure
CREATE OR REPLACE FUNCTION validate_quiz_feedback()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Skip validation if feedback is null or empty array
  IF NEW.feedback IS NULL OR jsonb_array_length(NEW.feedback) = 0 THEN
    NEW.feedback := '[]'::jsonb;
    RETURN NEW;
  END IF;

  -- Validate each feedback question
  FOR i IN 0..jsonb_array_length(NEW.feedback) - 1 LOOP
    DECLARE
      question jsonb := NEW.feedback->i;
    BEGIN
      -- Check required fields
      IF NOT (
        question ? 'id' AND
        question ? 'type' AND
        question ? 'text'
      ) THEN
        RAISE EXCEPTION 'Feedback question % is missing required fields', i + 1;
      END IF;

      -- Validate question type
      IF NOT (question->>'type' IN ('rating', 'open')) THEN
        RAISE EXCEPTION 'Invalid feedback type for question %: %', i + 1, question->>'type';
      END IF;

      -- Validate text is not empty
      IF (question->>'text') = '' THEN
        RAISE EXCEPTION 'Feedback question % must have text', i + 1;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create trigger for feedback validation
DROP TRIGGER IF EXISTS tr_validate_quiz_feedback ON teacher_quizzes;
CREATE TRIGGER tr_validate_quiz_feedback
  BEFORE INSERT OR UPDATE ON teacher_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION validate_quiz_feedback();
