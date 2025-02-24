-- Create teacher_quizzes table
CREATE TABLE teacher_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  title text NOT NULL,
  topic text NOT NULL,
  description text,
  code text UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teacher_quizzes ENABLE ROW LEVEL SECURITY;

-- Create function to generate unique 4-digit code
CREATE OR REPLACE FUNCTION generate_teacher_quiz_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  LOOP
    -- Generate a random 4-digit code
    v_code := lpad(floor(random() * 9000 + 1000)::text, 4, '0');
    
    -- Check if code exists
    SELECT EXISTS (
      SELECT 1 FROM teacher_quizzes WHERE code = v_code
    ) INTO v_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- Create trigger to automatically generate quiz code
CREATE OR REPLACE FUNCTION trigger_generate_teacher_quiz_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_teacher_quiz_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_generate_teacher_quiz_code
  BEFORE INSERT ON teacher_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_teacher_quiz_code();

-- Create policies
CREATE POLICY "Teacher quiz read policy"
  ON teacher_quizzes FOR SELECT
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Teacher quiz write policy"
  ON teacher_quizzes FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Teacher quiz modify policy"
  ON teacher_quizzes FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "Teacher quiz remove policy"
  ON teacher_quizzes FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());

-- Create function to validate quiz questions
CREATE OR REPLACE FUNCTION validate_teacher_quiz_questions()
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

CREATE TRIGGER tr_validate_teacher_quiz_questions
  BEFORE INSERT OR UPDATE ON teacher_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION validate_teacher_quiz_questions();
