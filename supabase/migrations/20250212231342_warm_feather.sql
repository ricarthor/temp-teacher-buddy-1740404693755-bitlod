/*
  # Fix Submissions and Add Score Calculation

  1. Changes
    - Add trigger to automatically calculate submission scores
    - Add function to calculate quiz scores based on correct answers
    - Add trigger to validate student IDs in submissions
    - Add trigger to ensure course_id matches quiz's course_id

  2. Security
    - All triggers run with security definer to ensure proper access
    - Validates data integrity and relationships
*/

-- Create function to calculate quiz score
CREATE OR REPLACE FUNCTION calculate_quiz_score(
  p_quiz_id uuid,
  p_responses jsonb
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_questions integer;
  v_correct_answers integer := 0;
  v_question record;
  v_response jsonb;
BEGIN
  -- Get total number of questions
  SELECT COUNT(*) INTO v_total_questions
  FROM questions
  WHERE quiz_id = p_quiz_id;

  -- Count correct answers
  FOR v_question IN SELECT id, correct_answer FROM questions WHERE quiz_id = p_quiz_id
  LOOP
    SELECT jsonb_array_elements(p_responses) INTO v_response
    WHERE (v_response->>'questionId')::uuid = v_question.id
    AND v_response->>'answer' = v_question.correct_answer;
    
    IF FOUND THEN
      v_correct_answers := v_correct_answers + 1;
    END IF;
  END LOOP;

  -- Calculate and return score as percentage
  RETURN (v_correct_answers::numeric / v_total_questions::numeric) * 100;
END;
$$;

-- Create trigger function to calculate score on submission
CREATE OR REPLACE FUNCTION trigger_calculate_submission_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Calculate and set the score
  NEW.score := calculate_quiz_score(NEW.quiz_id, NEW.responses);
  RETURN NEW;
END;
$$;

-- Create trigger function to validate submission data
CREATE OR REPLACE FUNCTION trigger_validate_submission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_course_id uuid;
BEGIN
  -- Get the course_id from the quiz
  SELECT course_id INTO v_quiz_course_id
  FROM quizzes
  WHERE id = NEW.quiz_id;

  -- Ensure the course_id matches the quiz's course_id
  IF NEW.course_id != v_quiz_course_id THEN
    RAISE EXCEPTION 'course_id must match the quiz''s course_id';
  END IF;

  -- Ensure the student exists and is enrolled in the course
  IF NOT EXISTS (
    SELECT 1
    FROM course_students
    WHERE course_id = NEW.course_id
    AND student_id = NEW.student_id
  ) THEN
    RAISE EXCEPTION 'Student must be enrolled in the course';
  END IF;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS tr_calculate_submission_score ON submissions;
CREATE TRIGGER tr_calculate_submission_score
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_calculate_submission_score();

DROP TRIGGER IF EXISTS tr_validate_submission ON submissions;
CREATE TRIGGER tr_validate_submission
  BEFORE INSERT OR UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_submission();
