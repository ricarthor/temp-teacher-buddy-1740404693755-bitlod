import React from 'react';
import { Star, Users } from 'lucide-react';

interface RatingStatsProps {
  averageRatings: Record<string, { average: number; count: number }>;
  totalResponses: number;
}

export function RatingStats({ averageRatings, totalResponses }: RatingStatsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-[#1e293b] mb-4">Rating Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Users className="w-5 h-5" />
            <span className="font-medium">Total Responses</span>
          </div>
          <div className="text-2xl font-semibold text-[#1e293b]">
            {totalResponses}
          </div>
        </div>

        {Object.entries(averageRatings).map(([type, { average, count }]) => (
          <div key={type} className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Star className="w-5 h-5" />
              <span className="font-medium capitalize">{type}</span>
            </div>
            <div className="text-2xl font-semibold text-[#1e293b]">
              {average}
            </div>
            <div className="text-sm text-[#64748b] mt-1">
              {count} responses
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
