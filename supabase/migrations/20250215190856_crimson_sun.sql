/*
  # Fix quiz data aggregation function
  
  1. Changes
    - Restructure the function to avoid CTE reuse
    - Fix submission aggregation logic
    - Improve data flow between queries
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

  -- Get submission statistics
  SELECT 
    jsonb_build_object(
      'total_submissions', COUNT(DISTINCT student_id),
      'average_score', ROUND(AVG(score)::numeric, 2),
      'median_score', percentile_cont(0.5) WITHIN GROUP (ORDER BY score),
      'highest_score', MAX(score),
      'lowest_score', MIN(score)
    )
  INTO v_submissions
  FROM submissions
  WHERE quiz_id = p_quiz_id;

  -- Get student-level metrics
  WITH student_submissions AS (
    SELECT DISTINCT ON (student_id)
      s.student_id,
      s.score,
      s.submitted_at,
      s.responses,
      st.name as student_name
    FROM submissions s
    JOIN students st ON s.student_id = st.id
    WHERE s.quiz_id = p_quiz_id
    ORDER BY s.student_id, s.submitted_at DESC
  )
  SELECT 
    jsonb_object_agg(
      student_id::text,
      jsonb_build_object(
        'score', score,
        'student_name', student_name,
        'submitted_at', submitted_at,
        'responses', responses
      )
    )
  INTO v_student_metrics
  FROM student_submissions;

  -- Get question-level data
  WITH question_responses AS (
    SELECT 
      q.id,
      q.text,
      q.type,
      q.correct_answer,
      s.responses
    FROM questions q
    LEFT JOIN submissions s ON s.quiz_id = p_quiz_id
    WHERE q.quiz_id = p_quiz_id
  ),
  question_stats AS (
    SELECT 
      qr.id,
      qr.text,
      qr.type,
      qr.correct_answer,
      COUNT(r) as total_attempts,
      COUNT(*) FILTER (
        WHERE (r->>'answer')::text = qr.correct_answer
      ) as correct_attempts
    FROM question_responses qr
    CROSS JOIN LATERAL jsonb_array_elements(qr.responses) r
    WHERE (r->>'questionId')::uuid = qr.id
    GROUP BY qr.id, qr.text, qr.type, qr.correct_answer
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
    'questions', COALESCE(v_questions, '[]'::jsonb)
  );

  RETURN v_result;
END;
$$;
