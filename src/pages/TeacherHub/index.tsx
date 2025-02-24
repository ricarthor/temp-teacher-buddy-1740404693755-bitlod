import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, MessageSquare, BookOpen, Filter, Download } from 'lucide-react';
import { SearchBar } from '../../components/SearchBar';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { FeedbackCard } from './components/FeedbackCard';
import { ComingSoonCard } from './components/ComingSoonCard';
import { MetricCard } from './components/MetricCard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
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

const performanceData = [
  { month: 'Jan', avgScore: 78, completionRate: 85, engagement: 72 },
  { month: 'Feb', avgScore: 82, completionRate: 88, engagement: 75 },
  { month: 'Mar', avgScore: 85, completionRate: 92, engagement: 80 },
  { month: 'Apr', avgScore: 83, completionRate: 90, engagement: 78 },
  { month: 'May', avgScore: 87, completionRate: 94, engagement: 85 },
  { month: 'Jun', avgScore: 89, completionRate: 95, engagement: 88 },
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

export function TeacherHub() {
  const { courseId } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDateRange, setSelectedDateRange] = useState('6m');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/course-analytics`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            },
            body: JSON.stringify({ course_id: courseId })
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [courseId]);

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Error loading analytics</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Teacher Hub</h1>
        <p className="text-textSecondary">Monitor student progress and engagement</p>
      </div>

      {/* Filters */}
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Students"
          value={loading ? '...' : analytics?.active_students || 0}
          trend={{ value: 12, isPositive: true }}
          icon={Users}
        />
        <MetricCard
          title="Average Rating"
          value={loading ? '...' : `${analytics?.ratings_summary.average_ratings.toFixed(1) || 0}/5`}
          trend={{ value: 5, isPositive: true }}
          icon={TrendingUp}
        />
        <MetricCard
          title="Total Ratings"
          value={loading ? '...' : analytics?.ratings_summary.total_ratings || 0}
          trend={{ value: 3, isPositive: true }}
          icon={BookOpen}
        />
        <MetricCard
          title="Feedback Responses"
          value={loading ? '...' : analytics?.feedback_summary.total_responses || 0}
          trend={{ value: 2, isPositive: false }}
          icon={MessageSquare}
        />
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-text mb-6">Performance Trends</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  name="Average Score"
                  stroke="#2563eb" 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="completionRate" 
                  name="Completion Rate"
                  stroke="#16a34a" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topic Performance - Temporarily removed */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text">Topic Performance</h2>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-textSecondary">Topic performance metrics coming soon</p>
        </div>
      </div>

      {/* Student Feedback */}
      <div>
        <h2 className="text-lg font-semibold text-text mb-6">Recent Feedback</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {studentFeedback.map(feedback => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </div>
      </div>

      {/* Coming Soon Features */}
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
    </div>
  );
}
