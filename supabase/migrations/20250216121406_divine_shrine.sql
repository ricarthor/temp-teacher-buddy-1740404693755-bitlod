-- Drop and recreate the get_quiz_data function with fixed type handling
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
  v_total_submissions integer;
  v_avg_score numeric;
  v_median_score numeric;
  v_max_score numeric;
  v_min_score numeric;
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

  IF v_quiz_data IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Quiz not found'
    );
  END IF;

  -- Get questions with their answers, ordered by ID for consistency
  WITH ordered_questions AS (
    SELECT 
      q.id,
      q.text,
      q.type,
      q.options,
      q.correct_answer,
      ROW_NUMBER() OVER (ORDER BY q.id) as question_order
    FROM questions q
    WHERE q.quiz_id = p_quiz_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'text', text,
      'type', type,
      'options', options,
      'correct_answer', correct_answer,
      'order', question_order
    )
    ORDER BY question_order
  )
  INTO v_questions
  FROM ordered_questions;

  -- Get student answers aggregated by student
  WITH answer_stats AS (
    SELECT 
      s.student_id,
      s.name as student_name,
      qa.quiz_id,
      MAX(qa.created_at) as submitted_at,
      jsonb_agg(
        jsonb_build_object(
          'questionId', qa.question_id,
          'answer', qa.selected_answer,
          'isCorrect', qa.is_correct
        )
        ORDER BY qa.question_id
      ) as responses,
      COUNT(*) FILTER (WHERE qa.is_correct)::float / NULLIF(COUNT(*), 0)::float * 100 as score
    FROM quiz_answers qa
    JOIN students s ON s.student_id = qa.student_id
    WHERE qa.quiz_id = p_quiz_id
    GROUP BY s.student_id, s.name, qa.quiz_id
  )
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'studentId', student_id,
        'studentName', student_name,
        'submittedAt', submitted_at,
        'responses', responses,
        'score', ROUND(COALESCE(score, 0)::numeric, 2)
      )
      ORDER BY student_name
    ),
    COUNT(*)::integer,
    ROUND(AVG(score)::numeric, 2),
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score)::numeric, 2),
    ROUND(MAX(score)::numeric, 2),
    ROUND(MIN(score)::numeric, 2)
  INTO 
    v_student_metrics,
    v_total_submissions,
    v_avg_score,
    v_median_score,
    v_max_score,
    v_min_score
  FROM answer_stats;

  -- Build statistics object with proper type handling
  v_submissions := jsonb_build_object(
    'totalSubmissions', COALESCE(v_total_submissions, 0),
    'averageScore', COALESCE(v_avg_score, 0),
    'medianScore', COALESCE(v_median_score, 0),
    'highestScore', COALESCE(v_max_score, 0),
    'lowestScore', COALESCE(v_min_score, 0)
  );

  -- Combine all data
  v_result := jsonb_build_object(
    'quiz', v_quiz_data,
    'questions', COALESCE(v_questions, '[]'::jsonb),
    'student_metrics', COALESCE(v_student_metrics, '[]'::jsonb),
    'stats', v_submissions
  );

  RETURN v_result;
END;
$$;
