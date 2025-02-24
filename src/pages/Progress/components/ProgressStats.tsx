import React from 'react';
import { TrendingUp, Users, Clock } from 'lucide-react';

interface ProgressStatsProps {
  stats: {
    averageScore: number;
    activeStudents: number;
    totalQuizzes: number;
  };
}

function StatCard({ icon: Icon, label, value }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 text-[#64748b] text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-2xl font-semibold text-[#1e293b] mt-2">
        {value}
      </div>
    </div>
  );
}

export function ProgressStats({ stats }: ProgressStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        icon={TrendingUp}
        label="Average Score"
        value={`${stats.averageScore.toFixed(1)}%`}
      />
      <StatCard
        icon={Users}
        label="Active Students"
        value={stats.activeStudents}
      />
      <StatCard
        icon={Clock}
        label="Total Quizzes"
        value={stats.totalQuizzes}
      />
    </div>
  );
}
