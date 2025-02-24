import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Course {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'archived';
  created_at: string;
  _count?: {
    students: number;
    quizzes: number;
  };
  _stats?: {
    average_score: number;
    completion_rate: number;
  };
}

interface UseCoursesResult {
  courses: Course[];
  isLoading: boolean;
  error: Error | null;
  refreshCourses: () => Promise<void>;
}

export function useCourses(): UseCoursesResult {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCourses = async () => {
    console.log('Fetching courses...');
    try {
      setIsLoading(true);
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_students (
            id,
            status
          ),
          teacher_quizzes (
            id,
            status,
            quiz_answers (
              id,
              is_correct
            )
          )
        `);

      console.log('Courses response:', { data: coursesData, error: coursesError });

      if (coursesError) throw coursesError;

      const processedCourses = coursesData.map(course => {
        const activeStudents = course.course_students?.filter(s => s.status === 'active').length || 0;
        const quizzes = course.teacher_quizzes || [];
        const totalQuizzes = quizzes.length;
        
        // Calculate quiz statistics
        let totalScore = 0;
        let totalAnswers = 0;
        quizzes.forEach((quiz: any) => {
          const answers = quiz.quiz_answers || [];
          const correctAnswers = answers.filter((a: any) => a.is_correct).length;
          totalScore += correctAnswers;
          totalAnswers += answers.length;
        });

        return {
          ...course,
          _count: {
            students: activeStudents,
            quizzes: totalQuizzes
          },
          _stats: {
            average_score: totalAnswers > 0 ? (totalScore / totalAnswers) * 100 : 0,
            completion_rate: activeStudents > 0 ? (totalQuizzes / activeStudents) * 100 : 0
          }
        };
      });

      console.log('Processed courses:', processedCourses);

      setCourses(processedCourses);
      setError(null);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return { courses, isLoading, error, refreshCourses: fetchCourses };
}
