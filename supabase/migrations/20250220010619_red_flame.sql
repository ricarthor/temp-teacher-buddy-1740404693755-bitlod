-- Drop and recreate the get_quiz_feedback function with simplified structure
CREATE OR REPLACE FUNCTION get_quiz_feedback(p_quiz_id uuid)
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
      'created_at', created_at
    )
    ORDER BY created_at DESC
  )
  FROM students_feedback
  WHERE quiz_id::uuid = p_quiz_id
  INTO v_feedback;

  -- Calculate simple average ratings
  WITH rating_stats AS (
    SELECT 
      key as rating_type,
      AVG((rating_field->>key)::numeric) as avg_rating,
      COUNT(*) as count
    FROM students_feedback,
    LATERAL jsonb_object_keys(rating_field) key
    WHERE quiz_id::uuid = p_quiz_id
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
      FROM students_feedback
      WHERE quiz_id::uuid = p_quiz_id
    )
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in get_quiz_feedback: %', SQLERRM;
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'ratings', '{}'::jsonb,
    'feedback', '[]'::jsonb,
    'total_responses', 0
  );
END;
$$;
