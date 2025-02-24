-- Drop and recreate the get_quiz_data function with proper ordering
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
  WITH latest_answers AS (
    -- Get the latest answer for each student-question combination
    SELECT DISTINCT ON (qa.student_id, qa.question_id)
      s.student_id,
      s.name as student_name,
      qa.quiz_id,
      qa.question_id,
      qa.created_at as submitted_at,
      qa.selected_answer,
      qa.is_correct
    FROM quiz_answers qa
    JOIN students s ON s.student_id = qa.student_id
    WHERE qa.quiz_id = p_quiz_id
    ORDER BY qa.student_id, qa.question_id, qa.created_at DESC
  ),
  student_answers AS (
    -- Aggregate answers by student with proper question ordering
    SELECT 
      la.student_id,
      la.student_name,
      la.quiz_id,
      MAX(la.submitted_at) as submitted_at,
      jsonb_agg(
        jsonb_build_object(
          'questionId', la.question_id,
          'answer', la.selected_answer,
          'isCorrect', la.is_correct
        )
        ORDER BY q.id
      ) as responses,
      (COUNT(*) FILTER (WHERE la.is_correct)) * 100.0 / COUNT(*) as score
    FROM latest_answers la
    JOIN questions q ON q.id = la.question_id
    GROUP BY la.student_id, la.student_name, la.quiz_id
  )
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', student_id,
      'studentId', student_id,
      'studentName', student_name,
      'submittedAt', submitted_at,
      'responses', responses,
      'score', ROUND(score::numeric, 2)
    )
    ORDER BY student_name
  )
  INTO v_student_metrics
  FROM student_answers;

  -- Calculate overall statistics
  WITH student_scores AS (
    SELECT 
      student_id,
      (COUNT(*) FILTER (WHERE is_correct)) * 100.0 / COUNT(*) as score
    FROM latest_answers
    GROUP BY student_id
  )
  SELECT jsonb_build_object(
    'totalSubmissions', COALESCE(COUNT(DISTINCT student_id), 0),
    'averageScore', ROUND(COALESCE(AVG(score), 0)::numeric, 2),
    'medianScore', ROUND(COALESCE(
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score), 0)::numeric, 2),
    'highestScore', ROUND(COALESCE(MAX(score), 0)::numeric, 2),
    'lowestScore', ROUND(COALESCE(MIN(score), 0)::numeric, 2)
  )
  INTO v_submissions
  FROM student_scores;

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
