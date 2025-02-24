import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { Plus, SlidersHorizontal, BookOpen, Code, Copy, Edit, Archive } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeacherQuiz {
  id: string;
  title: string;
  topic: string;
  description: string;
  code: string;
  status: 'draft' | 'active' | 'archived';
  questions: any[];
  created_at: string;
}

function QuizCard({ quiz, onEdit }: { quiz: TeacherQuiz; onEdit: (quiz: TeacherQuiz) => void }) {
  const copyCode = () => {
    navigator.clipboard.writeText(quiz.code);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">{quiz.title}</h3>
          <p className="text-[#64748b] text-sm">{quiz.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          quiz.status === 'active'
            ? 'bg-green-100 text-green-700'
            : quiz.status === 'draft'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <Code className="w-4 h-4" />
            Quiz Code
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono font-medium text-[#1e293b]">{quiz.code}</span>
            <button
              onClick={copyCode}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
              title="Copy code"
            >
              <Copy className="w-4 h-4 text-[#64748b]" />
            </button>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <BookOpen className="w-4 h-4" />
            Questions
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz.questions.length}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            Topic
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz.topic}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="text-sm text-[#64748b]">
          Created {new Date(quiz.created_at).toLocaleDateString()}
        </div>
        <div className="space-x-2">
          <button
            onClick={() => onEdit(quiz)}
            className="px-4 py-2 text-sm font-medium text-[#2563eb] hover:text-blue-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeacherQuizzes() {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<TeacherQuiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('teacher_quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setQuizzes(data || []);
    } catch (err: any) {
      console.error('Error fetching quizzes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (quiz: TeacherQuiz) => {
    navigate(`/quizzes/${quiz.id}/edit`);
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.code.includes(searchQuery);
    
    if (selectedFilter === 'active') return matchesSearch && quiz.status === 'active';
    if (selectedFilter === 'draft') return matchesSearch && quiz.status === 'draft';
    if (selectedFilter === 'archived') return matchesSearch && quiz.status === 'archived';
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[#1e293b] mb-2">My Quizzes</h1>
          <p className="text-[#64748b]">Create and manage your quiz library</p>
        </div>
        <button
          onClick={() => navigate('/create-quiz')}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Quiz
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search quizzes or enter a quiz code..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          >
            <option value="all">All Quizzes</option>
            <option value="active">Active</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
          <button className="px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {filteredQuizzes.map(quiz => (
          <QuizCard
            key={quiz.id}
            quiz={quiz}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No quizzes found</h3>
          <p className="text-[#64748b]">
            {searchQuery || selectedFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first quiz to get started'}
          </p>
        </div>
      )}
    </div>
  );
}
