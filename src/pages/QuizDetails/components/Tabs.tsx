import React from 'react';
import { cn } from '../../../lib/utils';
import { BarChart2, Users, MessageSquare } from 'lucide-react';

interface TabsProps {
  activeTab: 'performance' | 'insights' | 'feedback';
  onTabChange: (tab: 'performance' | 'insights' | 'feedback') => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-1">
      <div className="flex space-x-1">
        <button
          onClick={() => onTabChange('performance')}
          className={cn(
            'flex items-center gap-2 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'performance'
              ? 'bg-blue-50 text-[#2563eb]'
              : 'text-[#64748b] hover:text-[#1e293b] hover:bg-gray-50'
          )}
        >
          <Users className="w-4 h-4" />
          Students Performance
        </button>
        <button
          onClick={() => onTabChange('insights')}
          className={cn(
            'flex items-center gap-2 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'insights'
              ? 'bg-blue-50 text-[#2563eb]'
              : 'text-[#64748b] hover:text-[#1e293b] hover:bg-gray-50'
          )}
        >
          <BarChart2 className="w-4 h-4" />
          Insights
        </button>
        <button
          onClick={() => onTabChange('feedback')}
          className={cn(
            'flex items-center gap-2 flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
            activeTab === 'feedback'
              ? 'bg-blue-50 text-[#2563eb]'
              : 'text-[#64748b] hover:text-[#1e293b] hover:bg-gray-50'
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Feedback
        </button>
      </div>
    </div>
  );
}
