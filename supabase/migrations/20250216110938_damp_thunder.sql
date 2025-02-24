-- Add missing cascade delete policies
CREATE POLICY "Allow cascade delete for course owners"
  ON quiz_answers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = quiz_answers.quiz_id
      AND courses.user_id = auth.uid()
    )
  );

-- Add missing delete policies for questions
CREATE POLICY "Allow cascade delete for course owners"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes
      JOIN courses ON courses.id = quizzes.course_id
      WHERE quizzes.id = questions.quiz_id
      AND courses.user_id = auth.uid()
    )
  );

-- Add missing delete policies for quizzes
CREATE POLICY "Allow cascade delete for course owners"
  ON quizzes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = quizzes.course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Add missing delete policies for course_students
CREATE POLICY "Allow cascade delete for course owners"
  ON course_students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_students.course_id
      AND courses.user_id = auth.uid()
    )
  );
