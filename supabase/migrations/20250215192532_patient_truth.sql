-- Add missing policies for course_students
CREATE POLICY "Allow course owners to read course_students"
  ON course_students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_students.course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to insert course_students"
  ON course_students FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to update course_students"
  ON course_students FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow course owners to delete course_students"
  ON course_students FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_id
      AND courses.user_id = auth.uid()
    )
  );

-- Add missing policies for students
CREATE POLICY "Allow course owners to read students"
  ON students FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_students cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.student_id = students.id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow authenticated users to insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
