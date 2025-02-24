/*
  # Quiz Import Schema Updates

  1. Changes
    - Add quiz metadata fields to submissions table
    - Add quiz import function to handle CSV data

  2. Security
    - Function is security definer to run with elevated privileges
    - Validates course ownership
    - Handles student ID mapping
*/

-- Add quiz metadata fields to submissions table
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS quiz_title text,
ADD COLUMN IF NOT EXISTS quiz_topic text,
ADD COLUMN IF NOT EXISTS quiz_description text;

-- Create a function to import quiz data with metadata
CREATE OR REPLACE FUNCTION import_quiz_with_metadata(
  p_course_id uuid,
  p_quiz_title text,
  p_quiz_topic text,
  p_quiz_description text,
  p_submissions jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id uuid;
  v_submission jsonb;
  v_student_id uuid;
  v_responses jsonb;
BEGIN
  -- Verify course ownership
  IF NOT EXISTS (
    SELECT 1 FROM courses
    WHERE id = p_course_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized to import quiz for this course';
  END IF;

  -- Create quiz
  INSERT INTO quizzes (
    course_id,
    title,
    topic,
    description,
    status,
    due_date
  ) VALUES (
    p_course_id,
    p_quiz_title,
    p_quiz_topic,
    p_quiz_description,
    'completed',
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_quiz_id;

  -- Process submissions
  FOR v_submission IN 
    SELECT * FROM jsonb_array_elements(p_submissions)
  LOOP
    -- Get student ID from student_id
    SELECT id INTO v_student_id
    FROM students
    WHERE student_id = v_submission->>'student_id'
    AND id IN (
      SELECT student_id 
      FROM course_students 
      WHERE course_id = p_course_id
    );

    IF v_student_id IS NULL THEN
      CONTINUE; -- Skip if student not found or not enrolled
    END IF;

    -- Create submission with quiz metadata
    INSERT INTO submissions (
      quiz_id,
      course_id,
      student_id,
      responses,
      quiz_title,
      quiz_topic,
      quiz_description,
      submitted_at
    ) VALUES (
      v_quiz_id,
      p_course_id,
      v_student_id,
      v_submission->'responses',
      p_quiz_title,
      p_quiz_topic,
      p_quiz_description,
      COALESCE(
        (v_submission->>'submitted_at')::timestamptz,
        CURRENT_TIMESTAMP
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id,
    'processed_count', jsonb_array_length(p_submissions)
  );
END;
$$;
