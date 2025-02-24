-- Enable anonymous access to teacher_quizzes for quiz code validation
DROP POLICY IF EXISTS "Allow anonymous quiz code validation" ON teacher_quizzes;

CREATE POLICY "Allow anonymous quiz code validation"
  ON teacher_quizzes FOR SELECT
  TO anon
  USING (true);

-- Enable anonymous access to students table for ID validation
DROP POLICY IF EXISTS "Allow anonymous student validation" ON students;

CREATE POLICY "Allow anonymous student validation"
  ON students FOR SELECT
  TO anon
  USING (true);

-- Enable anonymous access to quiz_answers for duplicate check
DROP POLICY IF EXISTS "Allow anonymous quiz answer check" ON quiz_answers;

CREATE POLICY "Allow anonymous quiz answer check"
  ON quiz_answers FOR SELECT
  TO anon
  USING (true);

-- Enable anonymous access to quiz_answers for submitting answers
CREATE POLICY "Allow anonymous quiz answer submission"
  ON quiz_answers FOR INSERT
  TO anon
  WITH CHECK (true);

-- Enable anonymous access to quiz_answers for updating answers
CREATE POLICY "Allow anonymous quiz answer updates"
  ON quiz_answers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
