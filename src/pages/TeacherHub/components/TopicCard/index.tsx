import React from 'react';

interface TopicCardProps {
  topic: string;
  avgScore: number;
  improvement: number;
  students: number;
}

export function TopicCard({ topic, avgScore, improvement, students }: TopicCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-medium text-text">{topic}</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          improvement >= 0 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {improvement >= 0 ? '+' : ''}{improvement}%
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-textSecondary">Average Score</div>
          <div className="text-xl font-semibold text-text mt-1">{avgScore}%</div>
        </div>
        <div>
          <div className="text-sm text-textSecondary">Students</div>
          <div className="text-xl font-semibold text-text mt-1">{students}</div>
        </div>
      </div>
    </div>
  );
}
