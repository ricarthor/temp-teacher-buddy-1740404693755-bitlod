/*
  # Fix Quiz Import Function

  1. Changes
    - Fix JSON record handling in import_quiz function
    - Add proper type casting for responses
    - Improve error handling
    - Add validation for student IDs

  2. Security
    - Maintain existing security checks
    - Add additional validation for data integrity
*/

-- Drop and recreate the import_quiz function with fixed JSON handling
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
  v_question jsonb;
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

  -- Validate quiz data
  IF p_quiz_data IS NULL OR 
     p_quiz_data->>'title' IS NULL OR 
     p_quiz_data->>'topic' IS NULL OR
     p_quiz_data->'questions' IS NULL OR
     p_quiz_data->'submissions' IS NULL THEN
    RAISE EXCEPTION 'Invalid quiz data format';
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
    -- Generate unique student ID for this course
    DECLARE
      v_unique_student_id text;
    BEGIN
      v_unique_student_id := (v_submission->>'student_id') || '_' || 
                            substring(p_course_id::text, 1, 8);

      -- Get student ID
      SELECT id INTO v_student_id
      FROM students
      WHERE student_id = v_unique_student_id;

      -- Skip if student not found or not enrolled
      IF v_student_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM course_students
        WHERE course_id = p_course_id
        AND student_id = v_student_id
      ) THEN
        CONTINUE;
      END IF;

      -- Transform responses to match our schema
      WITH response_data AS (
        SELECT 
          q.id as question_id,
          r->>'answer' as answer,
          (arr.ordinality - 1) as question_index
        FROM jsonb_array_elements(v_submission->'responses') WITH ORDINALITY arr(r, ordinality)
        JOIN questions q ON q.quiz_id = v_quiz_id
        ORDER BY arr.ordinality
      )
      SELECT jsonb_agg(
        jsonb_build_object(
          'questionId', question_id,
          'answer', answer
        )
      ) INTO v_responses
      FROM response_data;

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
        COALESCE(v_responses, '[]'::jsonb),
        COALESCE(
          (v_submission->>'submitted_at')::timestamptz,
          CURRENT_TIMESTAMP
        )
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'quiz_id', v_quiz_id
  );
END;
$$;
