import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, MessageSquare, BookOpen, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon: React.ElementType;
}

function MetricCard({ title, value, trend, icon: Icon }: MetricCardProps) {
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

export function CourseMetrics({ courseId }: { courseId?: string }) {
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error('No session available');
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
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data as CourseAnalytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    if (courseId) {
      fetchAnalytics();
    }
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
  );
}
