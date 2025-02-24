import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Quiz, StudentAnswer, QuizStats } from '../types/quiz';

interface QuizData {
  quiz: Quiz;
  answers: StudentAnswer[];
  metrics: {
    quizStats: QuizStats;
    studentMetrics: Record<string, any>;
  };
  isLoading: boolean;
  error: Error | null;
}

const defaultQuiz: Quiz = {
  id: '',
  title: '',
  topic: '',
  description: '',
  questions: [],
  dueDate: new Date().toISOString(),
  createdAt: new Date().toISOString()
};

export function useQuizData(quizId: string, refreshTrigger: number = 0): QuizData {
  const [data, setData] = useState<QuizData>({
    quiz: defaultQuiz,
    answers: [],
    metrics: {
      quizStats: {
        averageScore: 0,
        medianScore: 0,
        highestScore: 0,
        lowestScore: 0,
        totalSubmissions: 0,
        feedbackMetrics: {
          averagePace: 0,
          averageDifficulty: 0,
          averageComfort: 0
        }
      },
      studentMetrics: {}
    },
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchQuizData() {
      if (!quizId) return;

      try {
        setData(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Get quiz data from teacher_quizzes
        const { data: quizData, error: quizError } = await supabase
          .from('teacher_quizzes')
          .select(`
            *,
            quiz_answers (
              id,
              student_id,
              selected_answer,
              is_correct,
              created_at,
              students (
                name,
                email
              )
            )
          `)
          .eq('id', quizId)
          .single();

        console.log('Quiz data:', quizData);

        if (quizError) {
          console.error('Error fetching quiz data:', quizError);
          throw quizError;
        }

        if (!quizData) {
          throw new Error('Quiz not found');
        }

        // Transform quiz data
        const quiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          topic: quizData.topic,
          description: quizData.description || '',
          questions: quizData.questions || [],
          dueDate: quizData.due_date || new Date().toISOString(),
          createdAt: quizData.created_at
        };

        // Transform student answers
        const answers: StudentAnswer[] = (quizData.quiz_answers || []).map((answer: any) => {
          const student = answer.students;
          return {
            id: answer.id,
            studentId: answer.student_id,
            studentName: student?.name || 'Unknown Student',
            studentEmail: student?.email || '',
            submittedAt: answer.created_at,
            responses: [{
              questionId: answer.question_id,
              answer: answer.selected_answer,
              isCorrect: answer.is_correct
            }]
          };
        });

        // Group answers by student
        const groupedAnswers = answers.reduce((acc: StudentAnswer[], curr) => {
          const existingStudent = acc.find(a => a.studentId === curr.studentId);
          if (existingStudent) {
            existingStudent.responses.push(...curr.responses);
          } else {
            acc.push({
              ...curr,
              responses: [...curr.responses]
            });
          }
          return acc;
        }, []);

        // Calculate metrics
        const totalSubmissions = new Set(answers.map(a => a.studentId)).size;
        const scores = groupedAnswers.map(student => {
          const correctAnswers = student.responses.filter(r => r.isCorrect).length;
          return (correctAnswers / student.responses.length) * 100;
        });

        const quizStats: QuizStats = {
          averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
          medianScore: scores.length ? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0,
          highestScore: scores.length ? Math.max(...scores) : 0,
          lowestScore: scores.length ? Math.min(...scores) : 0,
          totalSubmissions,
          feedbackMetrics: {
            averagePace: 0,
            averageDifficulty: 0,
            averageComfort: 0
          }
        };

        setData({
          quiz,
          answers: groupedAnswers,
          metrics: {
            quizStats,
            studentMetrics: {}
          },
          isLoading: false,
          error: null
        });
      } catch (err) {
        console.error('Error in useQuizData:', err);
        setData(prev => ({
          ...prev,
          error: err as Error,
          isLoading: false
        }));
      }
    }

    fetchQuizData();
  }, [quizId, refreshTrigger]);

  return data;
}
