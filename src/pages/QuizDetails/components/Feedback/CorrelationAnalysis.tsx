import React from 'react';
import { TrendingUp } from 'lucide-react';

interface CorrelationAnalysisProps {
  correlations: Record<string, Record<string, number>>;
}

export function CorrelationAnalysis({ correlations }: CorrelationAnalysisProps) {
  const ratingTypes = Object.keys(correlations);

  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue < 0.3) return 'bg-gray-100 text-gray-700';
    if (absValue < 0.5) return 'bg-blue-100 text-blue-700';
    if (absValue < 0.7) return 'bg-green-100 text-green-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-[#1e293b]">Correlation Analysis</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-[#64748b]"></th>
              {ratingTypes.map(type => (
                <th key={type} className="px-4 py-2 text-left text-sm font-medium text-[#64748b] capitalize">
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ratingTypes.map(type1 => (
              <tr key={type1} className="border-t border-gray-100">
                <td className="px-4 py-2 text-sm font-medium text-[#1e293b] capitalize">
                  {type1}
                </td>
                {ratingTypes.map(type2 => {
                  const correlation = correlations[type1][type2];
                  return (
                    <td key={type2} className="px-4 py-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getCorrelationColor(correlation)
                      }`}>
                        {correlation.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-gray-100"></span>
          <span className="text-[#64748b]">Weak (0.0-0.3)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-100"></span>
          <span className="text-[#64748b]">Moderate (0.3-0.5)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-100"></span>
          <span className="text-[#64748b]">Strong (0.5-0.7)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-purple-100"></span>
          <span className="text-[#64748b]">Very Strong (0.7-1.0)</span>
        </div>
      </div>
    </div>
  );
}
