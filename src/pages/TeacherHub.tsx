import React, { useState } from 'react';
import { Users, TrendingUp, MessageSquare, BookOpen, Brain, Filter, Download, Clock, AlertTriangle, ChevronDown, ChevronUp, Search, Sparkles } from 'lucide-react';
import { SearchBar } from '../components/SearchBar';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// import the componenents that are in the TeacherHub/components folder
import { TopicCard } from './TeacherHub/components/TopicCard';
import { FeedbackCard } from './TeacherHub/components/FeedbackCard';
import { ComingSoonCard } from './TeacherHub/components/ComingSoonCard';
import { CourseMetrics } from '../components/TeacherHub/CourseMetrics';
import { FeedbackTrendsChart } from '../components/TeacherHub/FeedbackTrendsChart';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Legend, AreaChart, Area, BoxPlot
} from 'recharts';

interface CourseAnalytics {
  active_students: number;
  ratings_summary: {
    average_ratings: number;
    total_ratings: number;
  };
  feedback_summary: {
    total_responses: number;
  };
}

// Mock data for engagement analysis
const engagementData = [
  { month: 'Jan', engagement: 72 },
  { month: 'Feb', engagement: 75 },
  { month: 'Mar', engagement: 80 },
  { month: 'Apr', engagement: 78 },
  { month: 'May', engagement: 85 },
  { month: 'Jun', engagement: 88 },
];

const topicPerformance = [
  { topic: 'JavaScript', avgScore: 85, improvement: 5, students: 120 },
  { topic: 'React', avgScore: 78, improvement: -2, students: 98 },
  { topic: 'Node.js', avgScore: 82, improvement: 3, students: 110 },
  { topic: 'SQL', avgScore: 88, improvement: 7, students: 105 },
  { topic: 'TypeScript', avgScore: 75, improvement: 4, students: 95 },
];

const studentFeedback = [
  {
    id: 1,
    student: 'Emma Thompson',
    topic: 'React Hooks',
    sentiment: 'positive',
    message: 'The practical exercises really helped understand the concepts better.',
    date: '2024-03-20',
    status: 'resolved'
  },
  {
    id: 2,
    student: 'Michael Chen',
    topic: 'TypeScript',
    sentiment: 'negative',
    message: 'Need more examples for advanced type concepts.',
    date: '2024-03-19',
    status: 'pending'
  },
  {
    id: 3,
    student: 'Sarah Johnson',
    topic: 'Node.js',
    sentiment: 'neutral',
    message: 'The pace was good but would like more hands-on projects.',
    date: '2024-03-18',
    status: 'in-progress'
  }
];

function MetricCard({ title, value, trend, icon: Icon }: {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-medium text-text">{title}</h3>
      </div>
      <div className="text-2xl font-semibold text-text mb-2">{value}</div>
      {trend && (
        <div className="flex items-center gap-2">
          {trend.isPositive ? (
            <ChevronUp className="w-4 h-4 text-green-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-600" />
          )}
          <span className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </span>
        </div>
      )}
    </div>
  );
}

export function TeacherHub() {
  const { courseId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('6m');
  const [selectedTopic, setSelectedTopic] = useState('all');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Teacher Hub</h1>
        <p className="text-textSecondary">Monitor student progress and engagement</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search students, topics, or feedback..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedDateRange}
            onChange={(e) => setSelectedDateRange(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
          </select>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Topics</option>
            <option value="js">JavaScript</option>
            <option value="react">React</option>
            <option value="node">Node.js</option>
          </select>
          <button className="px-4 py-2 text-textSecondary bg-card border border-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      <CourseMetrics courseId={courseId} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeedbackTrendsChart />
        <EngagementChart data={engagementData} />
      </div>

      <TopicPerformanceSection data={topicPerformance} />
      <RecentFeedbackSection data={studentFeedback} />
      <ComingSoonSection />
    </div>
  );
}

function EngagementChart({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold text-text mb-6">Engagement Analysis</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="engagement"
              name="Student Engagement"
              stroke="#8b5cf6"
              fill="#c4b5fd"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopicPerformanceSection({ data }: { data: any[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-text">Topic Performance</h2>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(topic => (
          <TopicCard key={topic.topic} {...topic} />
        ))}
      </div>
    </div>
  );
}

function RecentFeedbackSection({ data }: { data: any[] }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-6">Recent Feedback</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.map(feedback => (
          <FeedbackCard key={feedback.id} feedback={feedback} />
        ))}
      </div>
    </div>
  );
}

function ComingSoonSection() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-text mb-6">Coming Soon</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ComingSoonCard
          title="Self-Assessment Tracking"
          description="Monitor student self-evaluation responses and compare with actual performance"
        />
        <ComingSoonCard
          title="AI-Powered Insights"
          description="Get intelligent recommendations based on student performance patterns"
        />
        <ComingSoonCard
          title="Interactive Query System"
          description="Natural language queries for exploring student data"
        />
      </div>
    </div>
  );
}
