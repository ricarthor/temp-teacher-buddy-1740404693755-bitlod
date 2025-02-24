/*
  # Add quiz import function

  1. New Functions
    - `import_quiz`: Handles the entire quiz import process in a transaction
    - Validates and imports:
      - Quiz details
      - Questions
      - Student submissions
    - Returns the created quiz ID

  2. Security
    - Function is SECURITY DEFINER to ensure proper access control
    - Validates course ownership
    - Ensures data integrity
*/

-- Create function to import quiz data
CREATE OR REPLACE FUNCTION import_quiz(
  p_course_id uuid,
  p_quiz_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz_id uuid;
  v_question record;
  v_submission record;
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
    p_quiz_data->>'title',
    p_quiz_data->>'topic',
    COALESCE(p_quiz_data->>'description', ''),
    'completed',
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_quiz_id;

  -- Create questions
  FOR v_question IN 
    SELECT * FROM jsonb_array_elements(p_quiz_data->'questions')
  LOOP
    INSERT INTO questions (
      quiz_id,
      text,
      type,
      options,
      correct_answer
    ) VALUES (
      v_quiz_id,
      v_question->>'text',
      v_question->>'type',
      v_question->'options',
      v_question->>'correct_answer'
    );
  END LOOP;

  -- Process submissions
  FOR v_submission IN 
    SELECT * FROM jsonb_array_elements(p_quiz_data->'submissions')
  LOOP
    -- Get student ID from student_id
    SELECT id INTO v_student_id
    FROM students
    WHERE student_id = v_submission->>'student_id';

    IF v_student_id IS NULL THEN
      CONTINUE; -- Skip if student not found
    END IF;

    -- Verify student is enrolled in the course
    IF NOT EXISTS (
      SELECT 1 FROM course_students
      WHERE course_id = p_course_id
      AND student_id = v_student_id
    ) THEN
      CONTINUE; -- Skip if student not enrolled
    END IF;

    -- Transform responses to match our schema
    SELECT jsonb_agg(
      jsonb_build_object(
        'questionId', q.id,
        'answer', r->>'answer'
      )
    ) INTO v_responses
    FROM jsonb_array_elements(v_submission->'responses') WITH ORDINALITY AS arr(r, question_index)
    JOIN questions q ON q.quiz_id = v_quiz_id
    ORDER BY arr.question_index;

    -- Create submission
    INSERT INTO submissions (
      quiz_id,
      course_id,
      student_id,
      responses,
      submitted_at
    ) VALUES (
      v_quiz_id,
      p_course_id,
      v_student_id,
      v_responses,
      COALESCE(
        (v_submission->>'submitted_at')::timestamptz,
        CURRENT_TIMESTAMP
      )
    );
  END LOOP;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id
  );
END;
$$;
