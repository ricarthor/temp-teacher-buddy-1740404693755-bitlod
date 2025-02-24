import React, { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { Clock, Users, TrendingUp, AlertTriangle, SlidersHorizontal, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuizzes } from '../hooks/useQuizzes';

function QuizCard({ quiz }: { quiz: any }) {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">{quiz.title}</h3>
          <p className="text-[#64748b] text-sm">{quiz.topic}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          quiz.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <Clock className="w-4 h-4" />
            Due Date
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {new Date(quiz.due_date).toLocaleDateString()}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <Users className="w-4 h-4" />
            Completion
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz._stats?.completion_rate.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <TrendingUp className="w-4 h-4" />
            Average Score
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz._stats?.average_score.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <AlertTriangle className="w-4 h-4" />
            Flagged
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz._count?.flags} students
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="text-sm text-[#64748b]">
          {quiz._count?.submissions} submissions
        </div>
        <div className="space-x-2">
          <button className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors">
            Export Results
          </button>
          <button 
            onClick={() => navigate(`/quizzes/${quiz.id}`)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

export function Quizzes() {
  const { quizzes, isLoading, error } = useQuizzes();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredQuizzes = quizzes.filter(quiz => {
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quiz.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'active') return matchesSearch && quiz.status === 'active';
    if (selectedFilter === 'completed') return matchesSearch && quiz.status === 'completed';
    
    return matchesSearch;
  });

  if (isLoading) {
    return <div className="p-8">Loading quizzes...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Quizzes</h1>
        <p className="text-[#64748b]">Manage and monitor quiz performance</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search quizzes..."
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
            <option value="completed">Completed</option>
          </select>
          <button className="px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredQuizzes.map(quiz => (
          <QuizCard key={quiz.id} quiz={quiz} />
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No quizzes found</h3>
          <p className="text-[#64748b]">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
