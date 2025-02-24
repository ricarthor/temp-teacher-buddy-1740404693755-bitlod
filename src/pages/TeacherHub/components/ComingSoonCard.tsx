import React from 'react';
import { Sparkles } from 'lucide-react';

interface ComingSoonCardProps {
  title: string;
  description: string;
}

export function ComingSoonCard({ title, description }: ComingSoonCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-dashed border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-primary" />
        <div>
          <h3 className="font-medium text-text">{title}</h3>
          <div className="text-sm text-textSecondary">Coming Soon</div>
        </div>
      </div>
      <p className="text-text">{description}</p>
    </div>
  );
}
