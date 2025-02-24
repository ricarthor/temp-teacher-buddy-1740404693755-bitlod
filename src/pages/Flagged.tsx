import React, { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { AlertTriangle, TrendingDown, Clock, BookOpen, SlidersHorizontal, Flag } from 'lucide-react';

const mockFlaggedStudents = [
  {
    id: '1',
    name: 'Michael Chen',
    email: 'michael.c@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    flags: [
      {
        type: 'performance',
        description: 'Average score 25% below class mean',
        severity: 'high'
      },
      {
        type: 'engagement',
        description: 'Missed last 3 quizzes',
        severity: 'medium'
      }
    ],
    metrics: {
      averageScore: 62,
      classMean: 87,
      missedQuizzes: 3,
      lastActive: '2024-03-15'
    }
  },
  {
    id: '2',
    name: 'Sarah Wilson',
    email: 'sarah.w@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    flags: [
      {
        type: 'feedback',
        description: 'Reported difficulty keeping up with pace',
        severity: 'medium'
      }
    ],
    metrics: {
      averageScore: 78,
      classMean: 87,
      missedQuizzes: 1,
      lastActive: '2024-03-20'
    }
  },
  {
    id: '3',
    name: 'James Rodriguez',
    email: 'james.r@example.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    flags: [
      {
        type: 'performance',
        description: 'Significant score drop in recent quizzes',
        severity: 'high'
      },
      {
        type: 'feedback',
        description: 'Expressed struggling with content difficulty',
        severity: 'medium'
      }
    ],
    metrics: {
      averageScore: 65,
      classMean: 87,
      missedQuizzes: 0,
      lastActive: '2024-03-22'
    }
  }
];

function FlaggedStudentCard({ student }: { student: typeof mockFlaggedStudents[0] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <img
          src={student.avatar}
          alt={student.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#1e293b]">{student.name}</h3>
              <p className="text-[#64748b]">{student.email}</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
              Review Case
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {student.flags.map((flag, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  flag.severity === 'high' ? 'bg-red-50' : 'bg-amber-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    flag.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                  }`} />
                  <span className={`text-sm font-medium ${
                    flag.severity === 'high' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {flag.type.charAt(0).toUpperCase() + flag.type.slice(1)} Flag
                  </span>
                </div>
                <p className="text-[#64748b] text-sm mt-1">{flag.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <div className="flex items-center gap-1 text-[#64748b] text-sm">
                <TrendingDown className="w-4 h-4" />
                Average Score
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-[#1e293b]">
                  {student.metrics.averageScore}%
                </span>
                <span className="text-sm text-[#64748b] ml-1">
                  vs {student.metrics.classMean}%
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#64748b] text-sm">
                <BookOpen className="w-4 h-4" />
                Missed Quizzes
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-[#1e293b]">
                  {student.metrics.missedQuizzes}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-[#64748b] text-sm">
                <Clock className="w-4 h-4" />
                Last Active
              </div>
              <div className="mt-1">
                <span className="text-lg font-semibold text-[#1e293b]">
                  {new Date(student.metrics.lastActive).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Flagged() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredStudents = mockFlaggedStudents.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'high') {
      return matchesSearch && student.flags.some(flag => flag.severity === 'high');
    }
    if (selectedFilter === 'medium') {
      return matchesSearch && student.flags.every(flag => flag.severity === 'medium');
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Flagged Students</h1>
        <p className="text-[#64748b]">Review and manage students requiring attention</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search flagged students..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          >
            <option value="all">All Flags</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
          </select>
          <button className="px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.map(student => (
          <FlaggedStudentCard key={student.id} student={student} />
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Flag className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No flagged students found</h3>
          <p className="text-[#64748b]">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
