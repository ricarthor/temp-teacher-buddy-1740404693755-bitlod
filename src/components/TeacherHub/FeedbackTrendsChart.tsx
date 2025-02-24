import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../lib/supabase';

interface FeedbackAnalytics {
  rating_trends: {
    created_at: string;
    field: string;
    average_rating: number;
    count: number;
  }[];
}

// Define some nice colors for the lines
const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c'];

export function FeedbackTrendsChart() {
  const [analytics, setAnalytics] = useState<FeedbackAnalytics | null>(null);
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
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feedback-analytics`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const data = await response.json();
        setAnalytics(data as FeedbackAnalytics);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p className="font-medium">Error loading feedback trends</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
        <div className="h-[300px] bg-gray-100 rounded" />
      </div>
    );
  }

  // Get unique fields
  const fields = Array.from(
    new Set(analytics?.rating_trends.map(trend => trend.field) || [])
  );

  // Process data for the chart
  const chartData = analytics?.rating_trends.reduce((acc, curr) => {
    const existingDate = acc.find(item => item.created_at === curr.created_at);
    if (existingDate) {
      existingDate[curr.field] = curr.average_rating;
    } else {
      acc.push({
        created_at: curr.created_at,
        [curr.field]: curr.average_rating
      });
    }
    return acc;
  }, [] as any[]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold text-text mb-6">Rating Trends</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="created_at"
              tickFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <YAxis domain={[0, 5]} />
            <Tooltip
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
              formatter={(value: number) => [value.toFixed(2), "Rating"]}
            />
            <Legend />
            {fields.map((field, index) => (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                name={field.charAt(0).toUpperCase() + field.slice(1)}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
