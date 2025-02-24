import React from 'react';
import { TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  icon: React.ElementType;
}

export function MetricCard({ title, value, trend, icon: Icon }: MetricCardProps) {
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
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingUp className="w-4 h-4 text-red-600 transform rotate-180" />
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
