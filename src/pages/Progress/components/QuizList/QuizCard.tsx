import React from 'react';
import { Users, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    topic: string;
    status: string;
    _count: {
      submissions: number;
    };
    _stats: {
      average_score: number;
    };
  };
  courseId: string;
}

export function QuizCard({ quiz, courseId }: QuizCardProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">{quiz.title}</h3>
          <p className="text-[#64748b] text-sm">{quiz.topic}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          quiz.status === 'completed'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {quiz.status.charAt(0).toUpperCase() + quiz.status.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <Users className="w-4 h-4" />
            Submissions
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz._count.submissions}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[#64748b] text-sm">
            <TrendingUp className="w-4 h-4" />
            Average Score
          </div>
          <div className="mt-1 font-medium text-[#1e293b]">
            {quiz._stats.average_score.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t flex justify-end">
        <button
          onClick={() => navigate(`/courses/${courseId}/progress/${quiz.id}`)}
          className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
