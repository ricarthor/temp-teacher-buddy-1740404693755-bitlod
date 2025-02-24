import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  hasFilters: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Plus className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No quizzes found</h3>
      <p className="text-[#64748b]">
        {hasFilters
          ? 'Try adjusting your search or filter criteria'
          : 'Import your first quiz to start tracking student progress'}
      </p>
    </div>
  );
}
