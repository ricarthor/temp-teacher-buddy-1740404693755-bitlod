-- Drop and recreate the get_quiz_feedback function with fixed error handling
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
  v_debug jsonb;
BEGIN
  -- Log input
  RAISE NOTICE 'get_quiz_feedback called with quiz_id: %', p_quiz_id;

  -- Get all rating types first
  SELECT ARRAY_AGG(DISTINCT key ORDER BY key)
  FROM students_feedback,
  LATERAL jsonb_object_keys(rating_field) key
  WHERE quiz_id::uuid = p_quiz_id
  INTO v_rating_types;

  -- Log rating types
  RAISE NOTICE 'Found rating types: %', v_rating_types;

  -- Early return if no feedback exists
  IF v_rating_types IS NULL THEN
    RAISE NOTICE 'No rating types found, returning empty result';
    RETURN jsonb_build_object(
      'ratings', '{}'::jsonb,
      'correlations', '{}'::jsonb,
      'feedback', '[]'::jsonb,
      'total_responses', 0
    );
  END IF;

  -- Get raw feedback data for debugging
  SELECT jsonb_build_object(
    'count', COUNT(*),
    'sample', jsonb_agg(jsonb_build_object(
      'id', id,
      'rating_field', rating_field,
      'open_field', open_field
    )) FILTER (WHERE rating_field IS NOT NULL)
  )
  FROM students_feedback
  WHERE quiz_id::uuid = p_quiz_id
  INTO v_debug;

  RAISE NOTICE 'Debug data: %', v_debug;

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

  -- Log average ratings
  RAISE NOTICE 'Calculated ratings: %', v_ratings;

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

  -- Log correlations
  RAISE NOTICE 'Calculated correlations: %', v_correlations;

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

  -- Log feedback count
  RAISE NOTICE 'Found % feedback responses', jsonb_array_length(COALESCE(v_feedback, '[]'::jsonb));

  -- Build final result with debug info
  v_result := jsonb_build_object(
    'ratings', COALESCE(v_ratings, '{}'::jsonb),
    'correlations', COALESCE(v_correlations, '{}'::jsonb),
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'total_responses', (
      SELECT COUNT(*)
      FROM students_feedback
      WHERE quiz_id::uuid = p_quiz_id
    ),
    'debug', v_debug
  );

  RAISE NOTICE 'Returning result: %', v_result;
  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log error and return empty result with error information
  RAISE NOTICE 'Error in get_quiz_feedback: %', SQLERRM;
  RETURN jsonb_build_object(
    'error', SQLERRM,
    'ratings', '{}'::jsonb,
    'correlations', '{}'::jsonb,
    'feedback', '[]'::jsonb,
    'total_responses', 0,
    'debug', jsonb_build_object(
      'error_detail', SQLERRM
    )
  );
END;
$$;
