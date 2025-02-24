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
  -- Log input
  RAISE NOTICE 'get_quiz_feedback called with quiz_id: %', p_quiz_id;

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
      key AS rating_type,
      AVG((rating_field->>key)::numeric) AS avg_rating,
      COUNT(*) AS count
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

  -- Calculate correlations between ratings using a flattened approach
  WITH flattened_ratings AS (
    -- Flatten the ratings into rows
    SELECT 
      sf.id,
      key AS rating_type,
      (rating_field->>key)::numeric AS rating_value
    FROM students_feedback sf,
    LATERAL jsonb_object_keys(rating_field) key
    WHERE quiz_id::uuid = p_quiz_id
  ),
  rating_pairs AS (
    -- Join the flattened ratings with themselves to get pairs
    SELECT
      r1.rating_type AS type1,
      r2.rating_type AS type2,
      r1.rating_value AS value1,
      r2.rating_value AS value2
    FROM flattened_ratings r1
    JOIN flattened_ratings r2 
      ON r1.id = r2.id 
      AND r1.rating_type < r2.rating_type
  ),
  correlations AS (
    -- Calculate correlations for each pair
    SELECT
      type1,
      type2,
      CORR(value1, value2) AS correlation
    FROM rating_pairs
    GROUP BY type1, type2
  ),
  symmetric_correlations AS (
    -- Create symmetric correlation matrix
    SELECT type1, type2, correlation FROM correlations
    UNION ALL
    SELECT type2, type1, correlation FROM correlations
    UNION ALL
    SELECT DISTINCT rating_type, rating_type, 1.0
    FROM flattened_ratings
  ),
  inner_corr AS (
    -- Build a JSON object per rating type mapping to its correlations
    SELECT 
      type1, 
      jsonb_object_agg(
        type2,
        ROUND(COALESCE(correlation, 0)::numeric, 2)
      ) AS corr_object
    FROM symmetric_correlations
    GROUP BY type1
  )
  SELECT jsonb_object_agg(type1, corr_object)
  FROM inner_corr
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
  v_result := jsonb_build_object(
    'ratings', COALESCE(v_ratings, '{}'::jsonb),
    'correlations', COALESCE(v_correlations, '{}'::jsonb),
    'feedback', COALESCE(v_feedback, '[]'::jsonb),
    'total_responses', (
      SELECT COUNT(*)
      FROM students_feedback
      WHERE quiz_id::uuid = p_quiz_id
    )
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Log error and return empty result with error information
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
