-- Create quiz_feedback_imports table
CREATE TABLE quiz_feedback_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id text NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  rating_field jsonb NOT NULL,
  open_field jsonb NOT NULL,
  imported_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  UNIQUE(quiz_id, student_id)
);

-- Enable RLS
ALTER TABLE quiz_feedback_imports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Quiz owners can view feedback imports"
  ON quiz_feedback_imports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
          AND access_type = 'owner'
        )
      )
    )
  );

CREATE POLICY "Quiz owners can import feedback"
  ON quiz_feedback_imports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_id
      AND (
        courses.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM course_access
          WHERE course_id = courses.id
          AND user_id = auth.uid()
          AND access_type = 'owner'
        )
      )
    )
  );

-- Create function to import feedback from CSV
CREATE OR REPLACE FUNCTION import_quiz_feedback(
  p_quiz_id uuid,
  p_feedback jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  feedback_record jsonb;
  v_result jsonb := '[]'::jsonb;
  v_error text;
BEGIN
  -- Validate input
  IF p_quiz_id IS NULL THEN
    RAISE EXCEPTION 'Quiz ID cannot be null';
  END IF;

  -- Process each feedback record
  FOR feedback_record IN SELECT * FROM jsonb_array_elements(p_feedback)
  LOOP
    BEGIN
      -- Validate required fields
      IF NOT (
        feedback_record ? 'student_id' AND
        feedback_record ? 'rating_field' AND
        feedback_record ? 'open_field'
      ) THEN
        RAISE EXCEPTION 'Missing required fields in feedback record';
      END IF;

      -- Verify student exists
      IF NOT EXISTS (
        SELECT 1 FROM students 
        WHERE student_id = feedback_record->>'student_id'
      ) THEN
        RAISE EXCEPTION 'Student with ID % not found', feedback_record->>'student_id';
      END IF;

      -- Insert feedback
      INSERT INTO quiz_feedback_imports (
        quiz_id,
        student_id,
        rating_field,
        open_field
      )
      VALUES (
        p_quiz_id,
        feedback_record->>'student_id',
        feedback_record->'rating_field',
        feedback_record->'open_field'
      )
      ON CONFLICT (quiz_id, student_id) 
      DO UPDATE SET
        rating_field = EXCLUDED.rating_field,
        open_field = EXCLUDED.open_field,
        imported_at = now();

      -- Add successful import to result
      v_result := v_result || jsonb_build_object(
        'student_id', feedback_record->>'student_id',
        'status', 'success'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue with next record
      GET STACKED DIAGNOSTICS v_error = MESSAGE_TEXT;
      v_result := v_result || jsonb_build_object(
        'student_id', feedback_record->>'student_id',
        'status', 'error',
        'error', v_error
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'imported_feedback', v_result
  );
END;
$$;

-- Create function to get imported feedback
CREATE OR REPLACE FUNCTION get_imported_feedback(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_ratings jsonb;
  v_feedback jsonb;
BEGIN
  -- Get feedback responses with ratings
  SELECT jsonb_agg(
    jsonb_build_object(
      'rating_field', rating_field,
      'open_field', open_field,
      'imported_at', imported_at
    )
    ORDER BY imported_at DESC
  )
  FROM quiz_feedback_imports
  WHERE quiz_id = p_quiz_id
  INTO v_feedback;

  -- Calculate average ratings
  WITH rating_stats AS (
    SELECT 
      key as rating_type,
      AVG((rating_field->>key)::numeric) as avg_rating,
      COUNT(*) as count
    FROM quiz_feedback_imports,
    LATERAL jsonb_object_keys(rating_field) key
    WHERE quiz_id = p_quiz_id
    GROUP BY key
  )
  SELECT jsonb_object_agg(
    rating_type,
    jsonb_build_object(
      'average', ROUND(avg_rating::numeric, 2),
      'count', count
    )
  )
  FROM rating_stats
  INTO v_ratings;

  -- Build final result
  RETURN jsonb_build_object(
    'ratings', COALESCE(v_ratings, '{}'::jsonb),
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'total_responses', (
      SELECT COUNT(*)
      FROM quiz_feedback_imports
      WHERE quiz_id = p_quiz_id
    )
  );
END;
$$;
