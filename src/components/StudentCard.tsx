import React from 'react';
import { Mail, AlertTriangle, TrendingUp, Clock, BookOpen, Copy } from 'lucide-react';
import type { Student } from '../types/student';

interface StudentCardProps {
  student: Student;
}

export function StudentCard({ student }: StudentCardProps) {
  const copyEmail = () => {
    navigator.clipboard.writeText(student.email);
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-xl font-semibold text-blue-600">
            {student.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1">
          <div>
            <h3 className="text-lg font-semibold text-[#1e293b] flex items-center gap-2">
              {student.name}
              {student.flags && student.flags.length > 0 && (
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              )}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[#64748b]">
              <Mail className="w-4 h-4" />
              <span>{student.email}</span>
              <button
                onClick={copyEmail}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy email"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {student.flags && student.flags.length > 0 && (
            <div className="mt-4 space-y-2">
              {student.flags.map((flag, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    flag.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${
                      flag.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      flag.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)} Flag
                    </span>
                  </div>
                  <p className="text-[#64748b] text-sm mt-1">{flag.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-1 text-[#64748b] text-sm">
                <TrendingUp className="w-4 h-4" />
                Average Score
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-lg font-semibold text-[#1e293b]">
                  {student.academicRecord.averageScore}%
                </span>
                <span className={`text-sm font-medium ${
                  student.academicRecord.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {student.academicRecord.trend.isPositive ? '+' : '-'}
                  {student.academicRecord.trend.value}%
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#64748b] text-sm">
                <BookOpen className="w-4 h-4" />
                Quizzes Taken
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-[#1e293b]">
                  {student.academicRecord.quizzesTaken}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#64748b] text-sm">
                <Clock className="w-4 h-4" />
                Last Quiz
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-[#1e293b]">
                  {new Date(student.academicRecord.lastQuizDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
