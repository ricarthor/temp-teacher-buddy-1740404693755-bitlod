/*
  # Add quiz data aggregation function
  
  1. New Functions
    - `get_quiz_data`: Aggregates quiz data including:
      - Unique student submissions count
      - Average scores
      - Question-level statistics
      - Student performance metrics
  
  2. Changes
    - Adds a new function to properly aggregate quiz data
    - Ensures accurate submission counts and averages
*/

-- Function to get aggregated quiz data
CREATE OR REPLACE FUNCTION get_quiz_data(p_quiz_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_quiz_data record;
  v_submissions jsonb;
  v_student_metrics jsonb;
  v_questions jsonb;
BEGIN
  -- Get basic quiz information
  SELECT 
    q.id,
    q.title,
    q.topic,
    q.description,
    q.status,
    q.due_date,
    q.created_at
  INTO v_quiz_data
  FROM quizzes q
  WHERE q.id = p_quiz_id;

  -- Get unique student submissions with their latest attempt
  WITH latest_submissions AS (
    SELECT DISTINCT ON (student_id) 
      id,
      student_id,
      score,
      submitted_at,
      responses
    FROM submissions
    WHERE quiz_id = p_quiz_id
    ORDER BY student_id, submitted_at DESC
  )
  SELECT 
    jsonb_build_object(
      'total_submissions', COUNT(*),
      'average_score', ROUND(AVG(score)::numeric, 2),
      'median_score', percentile_cont(0.5) WITHIN GROUP (ORDER BY score),
      'highest_score', MAX(score),
      'lowest_score', MIN(score)
    )
  INTO v_submissions
  FROM latest_submissions;

  -- Get student-level metrics
  WITH student_data AS (
    SELECT 
      s.student_id,
      s.score,
      s.submitted_at,
      st.name as student_name,
      COUNT(*) FILTER (WHERE (r->>'answer')::text = q.correct_answer) as correct_answers,
      COUNT(*) as total_questions
    FROM latest_submissions s
    CROSS JOIN LATERAL jsonb_array_elements(s.responses) r
    JOIN questions q ON (r->>'questionId')::uuid = q.id
    JOIN students st ON s.student_id = st.id
    GROUP BY s.student_id, s.score, s.submitted_at, st.name
  )
  SELECT 
    jsonb_object_agg(
      student_id::text,
      jsonb_build_object(
        'score', score,
        'student_name', student_name,
        'submitted_at', submitted_at,
        'correct_answers', correct_answers,
        'total_questions', total_questions
      )
    )
  INTO v_student_metrics
  FROM student_data;

  -- Get question-level data
  WITH question_stats AS (
    SELECT 
      q.id,
      q.text,
      q.type,
      q.correct_answer,
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE (r->>'answer')::text = q.correct_answer) as correct_attempts
    FROM questions q
    LEFT JOIN latest_submissions s ON s.quiz_id = p_quiz_id
    CROSS JOIN LATERAL jsonb_array_elements(s.responses) r
    WHERE (r->>'questionId')::uuid = q.id
    GROUP BY q.id, q.text, q.type, q.correct_answer
  )
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'text', text,
        'type', type,
        'correct_answer', correct_answer,
        'success_rate', ROUND((correct_attempts::numeric / NULLIF(total_attempts, 0) * 100)::numeric, 2)
      )
    )
  INTO v_questions
  FROM question_stats;

  -- Combine all data
  v_result := jsonb_build_object(
    'quiz', v_quiz_data,
    'stats', v_submissions,
    'student_metrics', v_student_metrics,
    'questions', v_questions
  );

  RETURN v_result;
END;
$$;
