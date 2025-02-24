import React from 'react';
import { Filter } from 'lucide-react';
import { SearchBar } from '../../../components/SearchBar';

interface FiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDateRange: string;
  onDateRangeChange: (value: string) => void;
  selectedTopic: string;
  onTopicChange: (value: string) => void;
}

export function Filters({
  searchQuery,
  onSearchChange,
  selectedDateRange,
  onDateRangeChange,
  selectedTopic,
  onTopicChange
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search students, topics, or feedback..."
        />
      </div>
      <div className="flex gap-2">
        <select
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="1m">Last Month</option>
          <option value="3m">Last 3 Months</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last Year</option>
        </select>
        <select
          value={selectedTopic}
          onChange={(e) => onTopicChange(e.target.value)}
          className="px-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Topics</option>
          <option value="js">JavaScript</option>
          <option value="react">React</option>
          <option value="node">Node.js</option>
        </select>
        <button className="px-4 py-2 text-textSecondary bg-card border border-border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">More Filters</span>
        </button>
      </div>
    </div>
  );
}
