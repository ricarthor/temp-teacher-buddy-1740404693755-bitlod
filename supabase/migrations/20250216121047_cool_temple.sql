-- Drop and recreate the get_quiz_data function with proper student aggregation
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

  IF v_quiz_data IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'Quiz not found'
    );
  END IF;

  -- Get questions with their answers
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'text', q.text,
      'type', q.type,
      'options', q.options,
      'correct_answer', q.correct_answer
    )
  )
  INTO v_questions
  FROM questions q
  WHERE q.quiz_id = p_quiz_id
  ORDER BY q.created_at;

  -- Get student answers aggregated by student
  WITH student_answers AS (
    -- First, get the latest answer for each student-question combination
    SELECT DISTINCT ON (qa.student_id, qa.question_id)
      s.student_id,
      s.name as student_name,
      qa.quiz_id,
      qa.created_at as submitted_at,
      jsonb_build_object(
        'questionId', qa.question_id,
        'answer', qa.selected_answer,
        'isCorrect', qa.is_correct
      ) as response
    FROM quiz_answers qa
    JOIN students s ON s.student_id = qa.student_id
    WHERE qa.quiz_id = p_quiz_id
    ORDER BY qa.student_id, qa.question_id, qa.created_at DESC
  ),
  -- Then, aggregate all answers for each student
  aggregated_answers AS (
    SELECT 
      student_id,
      student_name,
      quiz_id,
      max(submitted_at) as submitted_at,
      jsonb_agg(response) as responses,
      (COUNT(*) FILTER (WHERE (response->>'isCorrect')::boolean)) * 100.0 / COUNT(*) as score
    FROM student_answers
    GROUP BY student_id, student_name, quiz_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'studentId', student_id,
      'studentName', student_name,
      'submittedAt', submitted_at,
      'responses', responses,
      'score', ROUND(score::numeric, 2)
    )
  )
  INTO v_student_metrics
  FROM aggregated_answers;

  -- Calculate overall statistics
  WITH answer_stats AS (
    SELECT 
      COUNT(DISTINCT student_id) as total_submissions,
      AVG(
        (COUNT(*) FILTER (WHERE is_correct)) * 100.0 / COUNT(*)
      ) as average_score
    FROM quiz_answers
    WHERE quiz_id = p_quiz_id
    GROUP BY student_id
  )
  SELECT jsonb_build_object(
    'totalSubmissions', COALESCE((SELECT COUNT(DISTINCT student_id) FROM quiz_answers WHERE quiz_id = p_quiz_id), 0),
    'averageScore', ROUND(COALESCE((SELECT AVG(score) FROM aggregated_answers), 0)::numeric, 2),
    'medianScore', ROUND(COALESCE(
      (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score)
       FROM aggregated_answers), 0)::numeric, 2),
    'highestScore', ROUND(COALESCE((SELECT MAX(score) FROM aggregated_answers), 0)::numeric, 2),
    'lowestScore', ROUND(COALESCE((SELECT MIN(score) FROM aggregated_answers), 0)::numeric, 2)
  )
  INTO v_submissions;

  -- Combine all data
  v_result := jsonb_build_object(
    'quiz', v_quiz_data,
    'questions', COALESCE(v_questions, '[]'::jsonb),
    'student_metrics', COALESCE(v_student_metrics, '[]'::jsonb),
    'stats', COALESCE(v_submissions, '{}'::jsonb)
  );

  RETURN v_result;
END;
$$;
