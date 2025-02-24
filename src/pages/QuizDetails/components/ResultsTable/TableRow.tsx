import React from 'react';
import type { Question, StudentAnswer } from '../../../../types/quiz';

interface AnswerChipProps {
  answer: string;
  isCorrect: boolean;
  correctAnswer: string;
}

function AnswerChip({ answer, isCorrect, correctAnswer }: AnswerChipProps) {
  return (
    <div className="relative group">
      <div className={`
        px-3 py-1 rounded-full text-sm font-medium inline-flex items-center
        ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
      `}>
        {answer}
      </div>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          {isCorrect ? 'Correct' : `Correct answer: ${correctAnswer}`}
        </div>
        <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
      </div>
    </div>
  );
}

interface TableRowProps {
  answer: StudentAnswer;
  questions: Question[];
  studentMetrics: any;
}

export function TableRow({ answer, questions, studentMetrics }: TableRowProps) {
  // Calculate the score based on correct answers
  const correctAnswers = answer.responses.filter(r => r.isCorrect).length;
  const totalQuestions = questions.length;
  const score = (correctAnswers / totalQuestions) * 100;

  // Get score chip styling based on score range
  const getScoreChipStyle = (score: number) => {
    if (score < 50) {
      return 'bg-red-100 text-red-700';
    } else if (score < 75) {
      return 'bg-yellow-100 text-yellow-700';
    } else {
      return 'bg-green-100 text-green-700';
    }
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="font-medium text-[#1e293b]">
          {answer.studentId}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="font-medium text-[#1e293b]">
            {answer.studentName || 'Unknown Student'}
          </div>
          <div className="text-sm text-[#64748b]">
            {answer.studentEmail || 'No email provided'}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-[#64748b]">
        {answer.submittedAt ? new Date(answer.submittedAt).toLocaleString() : 'Not submitted'}
      </td>
      {questions.map(question => {
        const response = answer.responses.find(r => r.questionId === question.id);
        return (
          <td key={question.id} className="px-6 py-4">
            {response ? (
              <AnswerChip
                answer={String(response.answer)}
                isCorrect={response.isCorrect}
                correctAnswer={String(question.correctAnswer)}
              />
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </td>
        );
      })}
      <td className="px-6 py-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreChipStyle(score)}`}>
          {score.toFixed(1)}%{score >= 90 && ' 🔥'}
        </div>
      </td>
    </tr>
  );
}
