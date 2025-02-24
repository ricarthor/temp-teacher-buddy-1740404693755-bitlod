-- Drop and recreate the get_quiz_feedback function with optimized correlation calculation
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
  SELECT ARRAY_AGG(DISTINCT key ORDER BY key)
  FROM students_feedback,
  LATERAL jsonb_object_keys(rating_field) key
  WHERE quiz_id::uuid = p_quiz_id
  INTO v_rating_types;

  -- Early return if no feedback exists
  IF v_rating_types IS NULL THEN
    RETURN jsonb_build_object(
      'ratings', '{}'::jsonb,
      'correlations', '{}'::jsonb,
      'feedback', '[]'::jsonb,
      'total_responses', 0
    );
  END IF;

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
  WITH rating_matrix AS (
    -- First, create a matrix of all ratings for each student
    SELECT 
      id,
      jsonb_object_agg(
        key,
        (rating_field->>key)::numeric
      ) as ratings
    FROM students_feedback,
    LATERAL jsonb_object_keys(rating_field) key
    WHERE quiz_id::uuid = p_quiz_id
    GROUP BY id
  ),
  correlation_pairs AS (
    -- Then calculate correlations between each pair of rating types
    SELECT 
      t1.key as type1,
      t2.key as type2,
      CORR(
        (rm.ratings->>t1.key)::numeric,
        (rm.ratings->>t2.key)::numeric
      ) as correlation
    FROM rating_matrix rm
    CROSS JOIN unnest(v_rating_types) as t1(key)
    CROSS JOIN unnest(v_rating_types) as t2(key)
    GROUP BY t1.key, t2.key
  )
  SELECT 
    jsonb_object_agg(
      type1,
      jsonb_object_agg(
        type2,
        ROUND(COALESCE(correlation, 0)::numeric, 2)
      )
    )
  FROM correlation_pairs
  INTO v_correlations;

  -- Get feedback responses
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
EXCEPTION WHEN OTHERS THEN
  -- Log error and return empty result
  RAISE NOTICE 'Error in get_quiz_feedback: %', SQLERRM;
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'ratings', '{}'::jsonb,
    'correlations', '{}'::jsonb,
    'feedback', '[]'::jsonb,
    'total_responses', 0
  );
END;
$$;
