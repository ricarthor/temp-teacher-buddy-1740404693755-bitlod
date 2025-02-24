import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Student } from '../types/student';

interface UseStudentsResult {
  students: Student[];
  isLoading: boolean;
  error: Error | null;
  stats: {
    totalStudents: number;
    activeStudents: number;
    flaggedStudents: number;
    averageScore: number;
  };
}

export function useStudents(courseId: string): UseStudentsResult {
  const [state, setState] = useState<UseStudentsResult>({
    students: [],
    isLoading: true,
    error: null,
    stats: {
      totalStudents: 0,
      activeStudents: 0,
      flaggedStudents: 0,
      averageScore: 0,
    },
  });

  useEffect(() => {
    async function fetchStudents() {
      if (!courseId) return;

      try {
        console.log('Fetching students for course:', courseId);

        // First get all students enrolled in this course with a direct join
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('course_students')
          .select(`
            id,
            course_id,
            student_id,
            status,
            students (
              id,
              student_id,
              name,
              email,
              status
            )
          `)
          .eq('course_id', courseId);

        console.log('Raw enrollments:', { data: enrollments, error: enrollmentError });

        if (enrollmentError) {
          console.error('Error fetching enrollments:', enrollmentError);
          throw enrollmentError;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log('No enrollments found for course:', courseId);
          setState({
            students: [],
            isLoading: false,
            error: null,
            stats: {
              totalStudents: 0,
              activeStudents: 0,
              flaggedStudents: 0,
              averageScore: 0
            }
          });
          return;
        }

        // Transform the data to match our Student type
        const students: Student[] = enrollments
          .filter(enrollment => enrollment.students) // Filter out any null students
          .map(enrollment => {
            return {
              id: enrollment.students.id,
              name: enrollment.students.name,
              email: enrollment.students.email,
              studentId: enrollment.students.student_id,
              status: enrollment.status as 'active' | 'inactive',
              academicRecord: {
                averageScore: 0,
                quizzesTaken: 0,
                lastQuizDate: new Date().toISOString(),
                trend: {
                  value: 0,
                  isPositive: true
                }
              },
              flags: []
            };
          });

        console.log('Processed students:', students);

        // Calculate stats
        const stats = {
          totalStudents: students.length,
          activeStudents: students.filter(s => s.status === 'active').length,
          flaggedStudents: 0,
          averageScore: 0,
        };

        setState({
          students,
          isLoading: false,
          error: null,
          stats,
        });
      } catch (error) {
        console.error('Error in fetchStudents:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error,
        }));
      }
    }

    fetchStudents();
  }, [courseId]);

  return state;
}
