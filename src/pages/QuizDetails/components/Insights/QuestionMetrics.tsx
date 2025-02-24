// src/pages/QuizDetails/components/Insights/QuestionMetrics.tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Question } from '../../../../types/quiz';

interface QuestionMetricsProps {
  questions: Question[];
  answers: {
    responses: Array<{
      questionId: string;
      answer: string;
      isCorrect: boolean;
    }>;
  }[];
}

interface QuestionStats {
  id: string;
  text: string;
  correctPercentage: number;
  totalAttempts: number;
  wrongAnswers: Array<{
    answer: string;
    count: number;
    percentage: number;
  }>;
}

export function QuestionMetrics({ questions, answers }: QuestionMetricsProps) {
  const questionStats: QuestionStats[] = React.useMemo(() => {
    return questions.map(question => {
      // Get all responses for this question
      const responses = answers.flatMap(a => 
        a.responses.filter(r => r.questionId === question.id)
      );

      const totalAttempts = responses.length;
      const correctAnswers = responses.filter(r => r.isCorrect).length;
      const correctPercentage = totalAttempts > 0 ? (correctAnswers / totalAttempts) * 100 : 0;

      // Get wrong answers with counts and percentages
      const wrongAnswers = responses
        .filter(r => !r.isCorrect)
        .reduce((acc, r) => {
          const existing = acc.find(wa => wa.answer === r.answer);
          if (existing) {
            existing.count++;
            existing.percentage = (existing.count / totalAttempts) * 100;
          } else {
            acc.push({
              answer: r.answer,
              count: 1,
              percentage: (1 / totalAttempts) * 100
            });
          }
          return acc;
        }, [] as Array<{ answer: string; count: number; percentage: number }>)
        .sort((a, b) => b.count - a.count);

      return {
        id: question.id,
        text: question.text,
        correctPercentage,
        totalAttempts,
        wrongAnswers
      };
    });
  }, [questions, answers]);

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#1e293b]">Question</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#1e293b]">Success Rate</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#1e293b]">Common Wrong Answers</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-[#1e293b]">Total Attempts</th>
            </tr>
          </thead>
          <tbody>
            {questionStats.map((stat, index) => (
              <tr key={stat.id} className="border-b border-gray-200">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-[#1e293b]">
                      Q{index + 1}
                    </div>
                    <div className="text-sm text-[#64748b]">
                      {stat.text.length > 100 
                        ? `${stat.text.substring(0, 100)}...` 
                        : stat.text}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    stat.correctPercentage >= 75
                      ? 'bg-green-100 text-green-700'
                      : stat.correctPercentage >= 50
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.correctPercentage.toFixed(1)}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  {stat.totalAttempts > 0 ? (
                    stat.wrongAnswers.length > 0 ? (
                      <div className="space-y-2">
                        {stat.wrongAnswers.map((wrongAnswer, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            <span className="text-[#1e293b]">{wrongAnswer.answer}</span>
                            <span className="text-[#64748b]">
                              ({wrongAnswer.count} students - {wrongAnswer.percentage.toFixed(1)}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-green-600 text-sm">No wrong answers</span>
                    )
                  ) : (
                    <span className="text-[#64748b] text-sm">No attempts</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-[#1e293b]">
                  {stat.totalAttempts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
