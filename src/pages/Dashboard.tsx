import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { Users, BookOpen, Flag, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const performanceData = [
  { month: 'Jan', score: 78 },
  { month: 'Feb', score: 82 },
  { month: 'Mar', score: 85 },
  { month: 'Apr', score: 83 },
  { month: 'May', score: 87 },
  { month: 'Jun', score: 89 },
];

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Dashboard</h1>
        <p className="text-[#64748b]">Overview of your class performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Students"
          value="156"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <MetricCard
          title="Active Quizzes"
          value="8"
          icon={BookOpen}
        />
        <MetricCard
          title="Flagged Students"
          value="12"
          icon={Flag}
          trend={{ value: 2, isPositive: false }}
        />
        <MetricCard
          title="Average Score"
          value="85%"
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold text-[#1e293b] mb-4">Performance Trend</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
