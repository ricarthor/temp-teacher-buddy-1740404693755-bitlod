import React, { useState } from 'react';

interface FeedbackFormProps {
  feedback: {
    id: string;
    type: 'rating' | 'open';
    text: string;
  }[];
  onSubmit: (responses: {
    rating_field: Record<string, number>;
    open_field: Record<string, string>;
  }) => void;
}

export function FeedbackForm({ feedback, onSubmit }: FeedbackFormProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [openAnswers, setOpenAnswers] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating_field: ratings,
      open_field: openAnswers
    });
  };

  const handleRatingChange = (id: string, value: number) => {
    setRatings(prev => ({ ...prev, [id]: value }));
  };

  const handleOpenAnswerChange = (id: string, value: string) => {
    setOpenAnswers(prev => ({ ...prev, [id]: value }));
  };

  const ratingQuestions = feedback.filter(q => q.type === 'rating');
  const openQuestions = feedback.filter(q => q.type === 'open');
  const totalSteps = ratingQuestions.length + openQuestions.length;

  const currentQuestion = currentStep < ratingQuestions.length 
    ? ratingQuestions[currentStep]
    : openQuestions[currentStep - ratingQuestions.length];

  const isLastStep = currentStep === totalSteps - 1;

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getEmoji = (value: number) => {
    switch(value) {
      case 1: return '😞';
      case 2: return '😕';
      case 3: return '😐';
      case 4: return '🙂';
      case 5: return '😄';
      default: return '😐';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-[#64748b] mb-2">
          <span>Progress</span>
          <span>{currentStep + 1} of {totalSteps}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#2563eb] rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <div
        key={currentStep}
        className="bg-white rounded-xl p-8 shadow-lg transition-all duration-300"
      >
        {currentQuestion.type === 'rating' ? (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-[#1e293b]">
              {currentQuestion.text}
            </h3>
            
            <div className="space-y-8">
              <div className="relative pt-8">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={ratings[currentQuestion.id] || 3}
                  onChange={(e) => handleRatingChange(currentQuestion.id, Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2563eb ${((ratings[currentQuestion.id] || 3) - 1) * 25}%, #e2e8f0 ${((ratings[currentQuestion.id] || 3) - 1) * 25}%)`
                  }}
                />
                <div className="absolute -top-2 left-0 right-0 flex justify-between px-4">
                  {[1, 2, 3, 4, 5].map(value => (
                    <div
                      key={value}
                      className={`w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-200 ${
                        ratings[currentQuestion.id] === value 
                          ? 'transform scale-110 -translate-y-1' 
                          : ''
                      }`}
                      onClick={() => handleRatingChange(currentQuestion.id, value)}
                    >
                      {getEmoji(value)}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-[#64748b]">
                <span>Not satisfied</span>
                <span>Very satisfied</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-[#1e293b]">
              {currentQuestion.text}
            </h3>
            <textarea
              value={openAnswers[currentQuestion.id] || ''}
              onChange={(e) => handleOpenAnswerChange(currentQuestion.id, e.target.value)}
              rows={4}
              className="w-full px-4 py-3 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-shadow"
              placeholder="Share your thoughts..."
            />
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-[#2563eb] hover:bg-blue-50'
            }`}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          
          {isLastStep ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
            >
              Submit Feedback
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="px-6 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
