/*
  # Fix Course Policies

  1. Changes
    - Drop existing policies to ensure clean state
    - Re-create policies with proper permissions
    - Add explicit owner-based policies for better security

  2. Security
    - Policies are restricted to authenticated users
    - Each user can only manage their own courses
    - Added user_id column to track course ownership
*/

-- Add user_id column to courses if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN user_id uuid REFERENCES auth.users(id);
    ALTER TABLE courses ALTER COLUMN user_id SET DEFAULT auth.uid();
  END IF;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to create courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to update courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to delete courses" ON courses;

-- Create new policies
CREATE POLICY "Enable read access for authenticated users"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for course owners"
  ON courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for course owners"
  ON courses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
