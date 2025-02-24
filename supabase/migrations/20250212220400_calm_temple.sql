/*
  # Add Course Policies

  1. Changes
    - Add INSERT policy for courses table to allow authenticated users to create courses
    - Add INSERT policy for course_students table to allow authenticated users to add students
    - Add UPDATE policy for courses table to allow authenticated users to update courses
    - Add DELETE policy for courses table to allow authenticated users to delete courses

  2. Security
    - Policies are restricted to authenticated users only
    - All operations require authentication
*/

-- Add INSERT policy for courses
CREATE POLICY "Allow authenticated users to create courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for courses
CREATE POLICY "Allow authenticated users to update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for courses
CREATE POLICY "Allow authenticated users to delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (true);

-- Add INSERT policy for course_students
CREATE POLICY "Allow authenticated users to add course students"
  ON course_students FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add UPDATE policy for course_students
CREATE POLICY "Allow authenticated users to update course students"
  ON course_students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for course_students
CREATE POLICY "Allow authenticated users to delete course students"
  ON course_students FOR DELETE
  TO authenticated
  USING (true);
