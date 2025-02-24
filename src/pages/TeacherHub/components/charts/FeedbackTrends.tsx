import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomBoxPlot } from './CustomBoxPlot';

interface FeedbackData {
  quiz: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  outliers: number[];
}

interface FeedbackTrendsProps {
  data: FeedbackData[];
}

export function FeedbackTrends({ data }: FeedbackTrendsProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h2 className="text-lg font-semibold text-text mb-6">Feedback Trends</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="quiz" />
            <YAxis domain={[0, 100]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-medium text-gray-900">{data.quiz}</p>
                      <p className="text-sm text-gray-600">Min: {data.min}%</p>
                      <p className="text-sm text-gray-600">Q1: {data.q1}%</p>
                      <p className="text-sm text-gray-600">Median: {data.median}%</p>
                      <p className="text-sm text-gray-600">Q3: {data.q3}%</p>
                      <p className="text-sm text-gray-600">Max: {data.max}%</p>
                      {data.outliers.length > 0 && (
                        <p className="text-sm text-red-600 mt-1">
                          Outliers: {data.outliers.join(', ')}%
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="median"
              fill="#2563eb"
              shape={<CustomBoxPlot />}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-100 border border-blue-600 rounded"></div>
          <span className="text-gray-600">Interquartile Range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Outliers</span>
        </div>
      </div>
    </div>
  );
}
