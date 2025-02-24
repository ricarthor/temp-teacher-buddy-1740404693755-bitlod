import React from 'react';
import { cn } from '../lib/utils';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, className }: MetricCardProps) {
  return (
    <div className={cn("bg-white rounded-xl p-6 shadow-sm", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#64748b] text-sm font-medium">{title}</p>
          <p className="text-[#1e293b] text-2xl font-semibold mt-2">{value}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <Icon className="w-5 h-5 text-[#2563eb]" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={cn(
            "text-sm font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
          </span>
          <span className="text-[#64748b] text-sm ml-1">vs last month</span>
        </div>
      )}
    </div>
  );
}
