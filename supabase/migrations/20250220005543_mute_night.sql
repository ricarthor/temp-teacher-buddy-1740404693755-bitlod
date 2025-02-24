-- Drop and recreate the get_quiz_feedback function with fixed correlation calculation
CREATE OR REPLACE FUNCTION get_quiz_feedback(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_ratings jsonb;
  v_correlations jsonb;
  v_feedback jsonb;
  v_rating_types text[];
BEGIN
  -- Get all rating types first
  SELECT ARRAY_AGG(DISTINCT key)
  FROM students_feedback,
  LATERAL jsonb_object_keys(rating_field) key
  WHERE quiz_id::uuid = p_quiz_id
  INTO v_rating_types;

  -- Calculate average ratings
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

  -- Calculate correlations between ratings
  WITH expanded_ratings AS (
    SELECT 
      sf.id,
      key as rating_type,
      (rating_field->>key)::numeric as rating_value
    FROM students_feedback sf,
    LATERAL jsonb_object_keys(rating_field) key
    WHERE quiz_id::uuid = p_quiz_id
  ),
  pairs AS (
    SELECT 
      r1.rating_type as type1,
      r2.rating_type as type2,
      CORR(r1.rating_value, r2.rating_value) as correlation
    FROM expanded_ratings r1
    JOIN expanded_ratings r2 
      ON r1.id = r2.id 
      AND r1.rating_type <= r2.rating_type
    GROUP BY r1.rating_type, r2.rating_type
  )
  SELECT jsonb_object_agg(
    type1,
    jsonb_object_agg(
      type2,
      ROUND(COALESCE(correlation, 0)::numeric, 2)
    )
  )
  FROM pairs
  INTO v_correlations;

  -- Get feedback responses
  SELECT jsonb_agg(
    jsonb_build_object(
      'rating_field', rating_field,
      'open_field', open_field,
      'created_at', created_at
    )
  )
  FROM students_feedback
  WHERE quiz_id::uuid = p_quiz_id
  INTO v_feedback;

  -- Build final result
  RETURN jsonb_build_object(
    'ratings', COALESCE(v_ratings, '{}'::jsonb),
    'correlations', COALESCE(v_correlations, '{}'::jsonb),
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'total_responses', (
      SELECT COUNT(*)
      FROM students_feedback
      WHERE quiz_id::uuid = p_quiz_id
    )
  );
END;
$$;
