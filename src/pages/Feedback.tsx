import React, { useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { SlidersHorizontal, TrendingUp, BookOpen, Clock, MessageSquare } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const mockFeedback = [
  {
    id: '1',
    quizTitle: 'JavaScript Fundamentals',
    date: '2024-03-20',
    metrics: {
      pace: 4,
      difficulty: 3,
      comfort: 4
    },
    qualitative: {
      continue: "The practical exercises are very helpful",
      start: "More real-world examples would be great",
      stop: "Too many theoretical concepts at once"
    },
    studentName: "Emma Thompson"
  },
  {
    id: '2',
    quizTitle: 'React Hooks Deep Dive',
    date: '2024-03-18',
    metrics: {
      pace: 2,
      difficulty: 4,
      comfort: 3
    },
    qualitative: {
      continue: "The code examples are clear and well-explained",
      start: "Would like more interactive coding sessions",
      stop: "Rushing through complex topics"
    },
    studentName: "Michael Chen"
  },
  {
    id: '3',
    quizTitle: 'Data Structures',
    date: '2024-03-15',
    metrics: {
      pace: 3,
      difficulty: 5,
      comfort: 2
    },
    qualitative: {
      continue: "The visual explanations of algorithms",
      start: "More practice problems would help",
      stop: "Moving to new topics before mastering current ones"
    },
    studentName: "Sarah Johnson"
  }
];

const trendData = [
  { month: 'Jan', pace: 3.8, difficulty: 3.2, comfort: 4.0 },
  { month: 'Feb', pace: 3.5, difficulty: 3.5, comfort: 3.8 },
  { month: 'Mar', pace: 3.2, difficulty: 3.8, comfort: 3.5 },
  { month: 'Apr', pace: 3.9, difficulty: 3.3, comfort: 3.9 },
];

const distributionData = [
  { rating: '1', count: 5 },
  { rating: '2', count: 12 },
  { rating: '3', count: 25 },
  { rating: '4', count: 30 },
  { rating: '5', count: 18 },
];

function FeedbackCard({ feedback }: { feedback: typeof mockFeedback[0] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">{feedback.quizTitle}</h3>
          <p className="text-[#64748b] text-sm">by {feedback.studentName}</p>
        </div>
        <div className="text-sm text-[#64748b]">
          {new Date(feedback.date).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-[#64748b] mb-1">Learning Pace</div>
          <div className="text-2xl font-semibold text-[#2563eb]">{feedback.metrics.pace}/5</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-[#64748b] mb-1">Difficulty</div>
          <div className="text-2xl font-semibold text-[#2563eb]">{feedback.metrics.difficulty}/5</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-[#64748b] mb-1">Comfort Level</div>
          <div className="text-2xl font-semibold text-[#2563eb]">{feedback.metrics.comfort}/5</div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium text-[#1e293b] mb-1">Continue Doing:</div>
          <p className="text-[#64748b] bg-gray-50 p-3 rounded-lg">{feedback.qualitative.continue}</p>
        </div>
        <div>
          <div className="text-sm font-medium text-[#1e293b] mb-1">Start Doing:</div>
          <p className="text-[#64748b] bg-gray-50 p-3 rounded-lg">{feedback.qualitative.start}</p>
        </div>
        <div>
          <div className="text-sm font-medium text-[#1e293b] mb-1">Stop Doing:</div>
          <p className="text-[#64748b] bg-gray-50 p-3 rounded-lg">{feedback.qualitative.stop}</p>
        </div>
      </div>
    </div>
  );
}

export function Feedback() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredFeedback = mockFeedback.filter(feedback => {
    const matchesSearch = feedback.quizTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feedback.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Student Feedback</h1>
        <p className="text-[#64748b]">Monitor and analyze student feedback and satisfaction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e293b] mb-4">Feedback Trends</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pace" stroke="#2563eb" name="Learning Pace" />
                <Line type="monotone" dataKey="difficulty" stroke="#7c3aed" name="Difficulty" />
                <Line type="monotone" dataKey="comfort" stroke="#059669" name="Comfort" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold text-[#1e293b] mb-4">Rating Distribution</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search feedback..."
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
          >
            <option value="all">All Feedback</option>
            <option value="recent">Recent</option>
            <option value="flagged">Flagged</option>
          </select>
          <button className="px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">More Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFeedback.map(feedback => (
          <FeedbackCard key={feedback.id} feedback={feedback} />
        ))}
      </div>

      {filteredFeedback.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No feedback found</h3>
          <p className="text-[#64748b]">Try adjusting your search criteria</p>
        </div>
      )}
    </div>
  );
}
