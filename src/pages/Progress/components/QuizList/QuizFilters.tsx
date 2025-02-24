import React from 'react';
import { SearchBar } from '../../../../components/SearchBar';
import { SlidersHorizontal } from 'lucide-react';

interface QuizFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
}

export function QuizFilters({
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange
}: QuizFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search quizzes..."
        />
      </div>
      <div className="flex gap-2">
        <select
          value={selectedFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
        >
          <option value="all">All Quizzes</option>
          <option value="recent">Recent</option>
          <option value="highest">Highest Scores</option>
          <option value="lowest">Lowest Scores</option>
        </select>
        <button className="px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">More Filters</span>
        </button>
      </div>
    </div>
  );
}
