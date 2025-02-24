import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { StudentCard } from '../components/StudentCard';
import { Filter, SlidersHorizontal, X } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';

const STUDENTS_PER_PAGE = 10;

export function Students() {
  const { courseId } = useParams();
  const { students, isLoading, error, stats } = useStudents(courseId || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [scoreRange, setScoreRange] = useState({ min: 0, max: 100 });
  const [quizzesTaken, setQuizzesTaken] = useState({ min: 0, max: 20 });
  const [displayCount, setDisplayCount] = useState(STUDENTS_PER_PAGE);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesScoreRange = student.academicRecord.averageScore >= scoreRange.min &&
                             student.academicRecord.averageScore <= scoreRange.max;
    
    const matchesQuizCount = student.academicRecord.quizzesTaken >= quizzesTaken.min &&
                            student.academicRecord.quizzesTaken <= quizzesTaken.max;
    
    if (selectedFilter === 'flagged') {
      return matchesSearch && matchesScoreRange && matchesQuizCount && 
             student.flags && student.flags.length > 0;
    }
    if (selectedFilter === 'high-performers') {
      return matchesSearch && matchesScoreRange && matchesQuizCount && 
             student.academicRecord.averageScore >= 90;
    }
    if (selectedFilter === 'at-risk') {
      return matchesSearch && matchesScoreRange && matchesQuizCount && 
             student.academicRecord.averageScore < 75;
    }
    if (selectedFilter === 'inactive') {
      return matchesSearch && matchesScoreRange && matchesQuizCount && 
             student.status === 'inactive';
    }
    
    return matchesSearch && matchesScoreRange && matchesQuizCount;
  });

  const displayedStudents = filteredStudents.slice(0, displayCount);
  const hasMore = displayedStudents.length < filteredStudents.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + STUDENTS_PER_PAGE);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-lg">
        <h3 className="font-semibold mb-2">Error Loading Students</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Course Students</h1>
        <p className="text-[#64748b]">Manage and monitor student progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-[#64748b] text-sm">Total Students</div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">{stats.totalStudents}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-[#64748b] text-sm">Active Students</div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">{stats.activeStudents}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-[#64748b] text-sm">Flagged Students</div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">{stats.flaggedStudents}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-[#64748b] text-sm">Average Score</div>
          <div className="text-2xl font-semibold text-[#1e293b] mt-2">
            {stats.averageScore.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search students..."
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            >
              <option value="all">All Students</option>
              <option value="flagged">Flagged</option>
              <option value="high-performers">High Performers</option>
              <option value="at-risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>
            <button 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                showAdvancedFilters ? 'bg-gray-50' : ''
              }`}
            >
              {showAdvancedFilters ? (
                <X className="w-4 h-4" />
              ) : (
                <SlidersHorizontal className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {showAdvancedFilters ? 'Hide Filters' : 'More Filters'}
              </span>
            </button>
          </div>
        </div>

        {showAdvancedFilters && (
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Average Score Range
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreRange.min}
                  onChange={(e) => setScoreRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
                <span className="text-[#64748b]">to</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={scoreRange.max}
                  onChange={(e) => setScoreRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1e293b] mb-2">
                Quizzes Taken Range
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="0"
                  value={quizzesTaken.min}
                  onChange={(e) => setQuizzesTaken(prev => ({ ...prev, min: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
                <span className="text-[#64748b]">to</span>
                <input
                  type="number"
                  min="0"
                  value={quizzesTaken.max}
                  onChange={(e) => setQuizzesTaken(prev => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {displayedStudents.map(student => (
          <StudentCard key={student.id} student={student} />
        ))}

        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Load More Students
            </button>
          </div>
        )}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No students found</h3>
          <p className="text-[#64748b]">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
