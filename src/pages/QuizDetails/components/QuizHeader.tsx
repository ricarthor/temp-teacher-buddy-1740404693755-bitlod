import React from 'react';
import { Users, TrendingUp, Clock } from 'lucide-react';

interface QuizHeaderProps {
  quiz: {
    title: string;
    description: string;
    dueDate: string;
  };
  metrics: {
    quizStats: {
      totalSubmissions?: number;
      averageScore?: number;
    };
  };
}

export function QuizHeader({ quiz, metrics }: QuizHeaderProps) {
  const { quizStats = {} } = metrics;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">{quiz.title}</h1>
        <p className="text-[#64748b]">{quiz.description || 'No description available'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            <Users className="w-4 h-4" />
            Total Submissions
          </div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">
            {quizStats.totalSubmissions || 0}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            <TrendingUp className="w-4 h-4" />
            Average Score
          </div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">
            {quizStats.averageScore?.toFixed(1) || '0.0'}%
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-[#64748b] text-sm">
            <Clock className="w-4 h-4" />
            Due Date
          </div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">
            {new Date(quiz.dueDate).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
