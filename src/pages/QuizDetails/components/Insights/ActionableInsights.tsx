// src/pages/QuizDetails/components/Insights/ActionableInsights.tsx
import React from 'react';
import { AlertTriangle, Users, BookOpen } from 'lucide-react';
import type { Question } from '../../../../types/quiz';

interface ActionableInsightsProps {
  questions: Question[];
  answers: {
    studentId: string;
    responses: Array<{
      questionId: string;
      answer: string;
      isCorrect: boolean;
    }>;
  }[];
  totalEnrolled: number;
}

export function ActionableInsights({ questions, answers, totalEnrolled }: ActionableInsightsProps) {
  const insights = React.useMemo(() => {
    // Calculate per-question success rates
    const questionStats = questions.map(question => {
      const responses = answers.flatMap(a => 
        a.responses.filter(r => r.questionId === question.id)
      );
      const correctAnswers = responses.filter(r => r.isCorrect).length;
      const successRate = (correctAnswers / responses.length) * 100;

      return {
        id: question.id,
        text: question.text,
        successRate,
        totalAttempts: responses.length
      };
    });

    // Find top 3 most failed questions
    const failedQuestions = [...questionStats]
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 3);

    // Count students with difficulties (success rate < 50%)
    const studentsWithDifficulties = answers.filter(answer => {
      const correctAnswers = answer.responses.filter(r => r.isCorrect).length;
      const successRate = (correctAnswers / answer.responses.length) * 100;
      return successRate < 50;
    }).length;

    // Count non-participating students
    const participatingStudents = new Set(answers.map(a => a.studentId)).size;
    const nonParticipatingStudents = totalEnrolled - participatingStudents;

    return {
      failedQuestions,
      studentsWithDifficulties,
      nonParticipatingStudents
    };
  }, [questions, answers, totalEnrolled]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-[#64748b] text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            Students Needing Support
          </div>
          <div className="text-2xl font-semibold text-[#1e293b]">
            {insights.studentsWithDifficulties}
          </div>
          <div className="text-sm text-[#64748b] mt-1">
            Students with success rate below 50%
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-[#64748b] text-sm mb-4">
            <Users className="w-4 h-4" />
            Missing Submissions
          </div>
          <div className="text-2xl font-semibold text-[#1e293b]">
            {insights.nonParticipatingStudents}
          </div>
          <div className="text-sm text-[#64748b] mt-1">
            Students who haven't taken the quiz
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-[#64748b] text-sm mb-4">
          <BookOpen className="w-4 h-4" />
          Top Questions to Review
        </div>
        <div className="space-y-4">
          {insights.failedQuestions.map((question, index) => (
            <div key={question.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="flex-none w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#1e293b]">
                    {question.text}
                  </div>
                  <div className="text-sm text-[#64748b] mt-1">
                    Success rate: {question.successRate.toFixed(1)}% ({question.totalAttempts} attempts)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
