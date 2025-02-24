import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Quiz {
  id: string;
  title: string;
  topic: string;
  description: string;
  status: 'draft' | 'active' | 'archived';
  code: string;
  created_at: string;
  updated_at: string;
  _count?: {
    submissions: number;
    flags: number;
  };
  _stats?: {
    average_score: number;
    completion_rate: number;
  };
}

interface UseQuizzesResult {
  quizzes: Quiz[];
  isLoading: boolean;
  error: Error | null;
}

export function useQuizzes(): UseQuizzesResult {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchQuizzes() {
      try {
        // Fetch quizzes with answers
        const { data: quizzesData, error: quizzesError } = await supabase
          .from('teacher_quizzes')
          .select(`
            *,
            quiz_answers (
              id,
              is_correct,
              student_id
            )
          `);

        if (quizzesError) throw quizzesError;

        // Process and transform the data
        const processedQuizzes = quizzesData.map(quiz => {
          const answers = quiz.quiz_answers || [];
          const uniqueStudents = new Set(answers.map(a => a.student_id));
          const totalStudents = uniqueStudents.size;
          const correctAnswers = answers.filter(a => a.is_correct).length;
          const totalAnswers = answers.length;
          
          return {
            ...quiz,
            _count: {
              submissions: totalStudents,
              flags: 0, // Flags are not implemented yet
            },
            _stats: {
              average_score: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
              completion_rate: totalStudents > 0 ? (totalStudents / 100) * 100 : 0,
            },
          };
        });

        setQuizzes(processedQuizzes);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    }

    fetchQuizzes();
  }, []);

  return { quizzes, isLoading, error };
}
