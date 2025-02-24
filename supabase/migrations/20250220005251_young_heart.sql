-- Drop and recreate the get_quiz_feedback function with correct column name
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
  WHERE quiz_id = p_quiz_id
  INTO v_rating_types;

  -- Calculate average ratings
  WITH rating_stats AS (
    SELECT 
      key as rating_type,
      AVG((rating_field->>key)::numeric) as avg_rating,
      COUNT(*) as count
    FROM students_feedback,
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

  -- Calculate correlations between ratings
  WITH pairs AS (
    SELECT 
      r1.key as type1,
      r2.key as type2,
      CORR(
        (sf.rating_field->>r1.key)::numeric,
        (sf.rating_field->>r2.key)::numeric
      ) as correlation
    FROM students_feedback sf
    CROSS JOIN LATERAL jsonb_object_keys(rating_field) r1
    CROSS JOIN LATERAL jsonb_object_keys(rating_field) r2
    WHERE quiz_id = p_quiz_id
    GROUP BY r1.key, r2.key
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
  WHERE quiz_id = p_quiz_id
  INTO v_feedback;

  -- Build final result
  RETURN jsonb_build_object(
    'ratings', COALESCE(v_ratings, '{}'::jsonb),
    'correlations', COALESCE(v_correlations, '{}'::jsonb),
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'total_responses', (
      SELECT COUNT(*)
      FROM students_feedback
      WHERE quiz_id = p_quiz_id
    )
  );
END;
$$;
