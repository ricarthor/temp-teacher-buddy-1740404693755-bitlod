import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface FeedbackQuestion {
  id: string;
  type: 'rating' | 'open';
  text: string;
}

interface FeedbackEditorProps {
  feedback: FeedbackQuestion[];
  onChange: (feedback: FeedbackQuestion[]) => void;
}

export function FeedbackEditor({ feedback, onChange }: FeedbackEditorProps) {
  const addQuestion = (type: 'rating' | 'open') => {
    const newQuestion: FeedbackQuestion = {
      id: crypto.randomUUID(),
      type,
      text: ''
    };
    onChange([...feedback, newQuestion]);
  };

  const updateQuestion = (id: string, text: string) => {
    onChange(
      feedback.map(q => q.id === id ? { ...q, text } : q)
    );
  };

  const removeQuestion = (id: string) => {
    onChange(feedback.filter(q => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#1e293b] mb-4">Feedback Questions</h3>
        <p className="text-[#64748b] mb-6">
          Add questions to collect feedback from students after they complete the quiz.
        </p>
      </div>

      {/* Rating Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-[#1e293b]">Rating Questions (1-5 scale)</h4>
          <button
            type="button"
            onClick={() => addQuestion('rating')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rating Question
          </button>
        </div>
        <div className="space-y-3">
          {feedback.filter(q => q.type === 'rating').map(question => (
            <div key={question.id} className="flex items-start gap-3">
              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestion(question.id, e.target.value)}
                placeholder="e.g., How would you rate the difficulty of this quiz?"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove question"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Open Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-medium text-[#1e293b]">Open Questions</h4>
          <button
            type="button"
            onClick={() => addQuestion('open')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Open Question
          </button>
        </div>
        <div className="space-y-3">
          {feedback.filter(q => q.type === 'open').map(question => (
            <div key={question.id} className="flex items-start gap-3">
              <input
                type="text"
                value={question.text}
                onChange={(e) => updateQuestion(question.id, e.target.value)}
                placeholder="e.g., What suggestions do you have for improving this quiz?"
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              />
              <button
                type="button"
                onClick={() => removeQuestion(question.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove question"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
