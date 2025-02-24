import React from 'react';

interface Feedback {
  id: number;
  student: string;
  topic: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  message: string;
  date: string;
  status: string;
}

interface FeedbackCardProps {
  feedback: Feedback;
}

export function FeedbackCard({ feedback }: FeedbackCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-medium text-text">{feedback.student}</h3>
          <p className="text-sm text-textSecondary">{feedback.topic}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          feedback.sentiment === 'positive' 
            ? 'bg-green-100 text-green-700'
            : feedback.sentiment === 'negative'
            ? 'bg-red-100 text-red-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {feedback.status}
        </div>
      </div>
      <p className="text-text mb-4">{feedback.message}</p>
      <div className="text-sm text-textSecondary">
        {new Date(feedback.date).toLocaleDateString()}
      </div>
    </div>
  );
}
