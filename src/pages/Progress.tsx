import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ProgressHeader } from './Progress/components/ProgressHeader';
import { QuizFilters } from './Progress/components/QuizList/QuizFilters';
import { QuizCard } from './Progress/components/QuizList/QuizCard';
import { EmptyState } from './Progress/components/QuizList/EmptyState';

export function Progress() {
  const { courseId } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [stats, setStats] = useState({
    averageScore: 0,
    activeStudents: 0,
    totalQuizzes: 0
  });

  useEffect(() => {
    if (courseId) {
      fetchQuizzes();
      fetchStats();
    }
  }, [courseId]);

  const fetchQuizzes = async () => {
    if (!courseId) return;

    try {
      console.log('Fetching quizzes for course:', courseId);

      // First get the course to check access
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          id,
          user_id,
          course_access (
            user_id,
            access_type
          )
        `)
        .eq('id', courseId)
        .single();

      console.log('Course data:', courseData);
      console.log('Course error:', courseError);

      if (courseError) throw courseError;

      // Then get all quizzes for this course
      const { data: courseQuizzes, error: quizzesError } = await supabase
        .from('teacher_quizzes')
        .select(`
          *,
          quiz_answers (
            id,
            is_correct,
            student_id
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'active');

      console.log('Course quizzes:', courseQuizzes);
      console.log('Quizzes error:', quizzesError);

      if (quizzesError) throw quizzesError;

      // If no quizzes found with course_id, try fetching shared quizzes
      let allQuizzes = courseQuizzes || [];
      if (!courseQuizzes || courseQuizzes.length === 0) {
        console.log('No course quizzes found, checking shared quizzes');
        
        const { data: sharedQuizzes, error: sharedError } = await supabase
          .from('teacher_quizzes')
          .select(`
            *,
            quiz_answers (
              id,
              is_correct,
              student_id
            )
          `)
          .eq('status', 'active')
          .is('course_id', null);

        console.log('Shared quizzes:', sharedQuizzes);
        console.log('Shared error:', sharedError);

        if (!sharedError && sharedQuizzes) {
          allQuizzes = [...allQuizzes, ...sharedQuizzes];
        }
      }

      const processedQuizzes = allQuizzes.map(quiz => {
        const answers = quiz.quiz_answers || [];
        const uniqueStudents = new Set(answers.map(a => a.student_id));
        const totalStudents = uniqueStudents.size;
        const correctAnswers = answers.filter(a => a.is_correct).length;
        const totalAnswers = answers.length;
        
        return {
          ...quiz,
          _count: {
            submissions: totalStudents
          },
          _stats: {
            average_score: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0
          }
        };
      });

      console.log('Processed quizzes:', processedQuizzes);
      setQuizzes(processedQuizzes);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError('Failed to fetch quizzes');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!courseId) return;

    try {
      const { data: studentsData } = await supabase
        .from('course_students')
        .select('id')
        .eq('course_id', courseId)
        .eq('status', 'active');

      const { data: quizData } = await supabase
        .from('teacher_quizzes')
        .select(`
          id,
          quiz_answers (
            id,
            is_correct
          )
        `)
        .eq('course_id', courseId)
        .eq('status', 'active');

      console.log('Stats data:', { studentsData, quizData });

      const totalAnswers = quizData?.reduce((acc, quiz) => {
        const answers = quiz.quiz_answers || [];
        return acc + answers.length;
      }, 0) || 0;

      const correctAnswers = quizData?.reduce((acc, quiz) => {
        const answers = quiz.quiz_answers || [];
        return acc + answers.filter(a => a.is_correct).length;
      }, 0) || 0;

      setStats({
        averageScore: totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0,
        activeStudents: studentsData?.length || 0,
        totalQuizzes: quizData?.length || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'recent') {
      return matchesSearch && new Date(quiz.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    if (selectedFilter === 'highest') {
      return matchesSearch && quiz._stats.average_score >= 85;
    }
    if (selectedFilter === 'lowest') {
      return matchesSearch && quiz._stats.average_score < 70;
    }
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProgressHeader
        title="Active Quizzes"
        description="Monitor quiz performance and student progress"
      />

      <QuizFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      {filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuizzes.map(quiz => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              courseId={courseId!}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          hasFilters={searchQuery !== '' || selectedFilter !== 'all'}
        />
      )}
    </div>
  );
}
