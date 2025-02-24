import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { useCourses } from '../hooks/useCourses';
import { Calendar, Users, BookOpen, Archive, SlidersHorizontal, Plus, Trash2, X, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ShareCourseModal } from './Courses/components/ShareCourseModal';

interface Course {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'archived';
  start_date: string;
  end_date: string;
  created_at: string;
  _count?: {
    students: number;
    quizzes: number;
  };
}

interface DeleteModalProps {
  course: Course;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

function DeleteModal({ course, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-[#1e293b]">Delete Course</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-[#64748b] mb-4">
          Are you sure you want to delete <span className="font-medium text-[#1e293b]">{course.name}</span>? 
          This action cannot be undone and will remove all associated data including student records, 
          quizzes, and progress information.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Course
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CourseMetricProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
}

function CourseMetric({ icon: Icon, label, value }: CourseMetricProps) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[#64748b] text-sm">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="mt-1 font-medium text-[#1e293b]">
        {value}
      </div>
    </div>
  );
}

interface CourseCardProps {
  course: Course;
  onDelete: (course: Course) => void;
}

function CourseCard({ course, onDelete }: CourseCardProps) {
  const navigate = useNavigate();
  const [showShareModal, setShowShareModal] = useState(false);
  
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">{course.name}</h3>
          <p className="text-[#64748b] text-sm">{course.description}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          course.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CourseMetric
          icon={Calendar}
          label="Start Date"
          value={new Date(course.start_date).toLocaleDateString()}
        />
        <CourseMetric
          icon={Users}
          label="Students"
          value={course._count?.students || 0}
        />
        <CourseMetric
          icon={BookOpen}
          label="Quizzes"
          value={course._count?.quizzes || 0}
        />
        <CourseMetric
          icon={Archive}
          label="End Date"
          value={new Date(course.end_date).toLocaleDateString()}
        />
      </div>

      <div className="mt-4 pt-4 border-t flex justify-between items-center">
        <div className="text-sm text-[#64748b]">
          Created {new Date(course.created_at).toLocaleDateString()}
        </div>
        <div className="space-x-2">
          <button
            onClick={() => onDelete(course)}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 text-sm font-medium text-[#2563eb] hover:text-blue-700 transition-colors"
          >
            Share
          </button>
          <button 
            onClick={() => navigate(`/courses/${course.id}/students`)}
            className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors"
          >
            View Course
          </button>
        </div>
      </div>

      {showShareModal && (
        <ShareCourseModal
          courseId={course.id}
          courseName={course.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}

interface CourseHeaderProps {
  onNewCourse: () => void;
}

function CourseHeader({ onNewCourse }: CourseHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Courses</h1>
        <p className="text-[#64748b]">Manage your courses and student enrollments</p>
      </div>
      <button
        onClick={onNewCourse}
        className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Course
      </button>
    </div>
  );
}

interface CourseFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedFilter: string;
  onFilterChange: (value: string) => void;
}

function CourseFilters({ searchQuery, onSearchChange, selectedFilter, onFilterChange }: CourseFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search courses..."
        />
      </div>
      <div className="flex gap-2">
        <select
          value={selectedFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
        >
          <option value="all">All Courses</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        <button className="px-4 py-2 text-[#64748b] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">More Filters</span>
        </button>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <BookOpen className="w-12 h-12 text-[#64748b] mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-[#1e293b] mb-1">No courses found</h3>
      <p className="text-[#64748b]">{message}</p>
    </div>
  );
}

export function Courses() {
  const { courses, isLoading, error, refreshCourses } = useCourses();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!courseToDelete) return;
    
    console.log('Attempting to delete course:', {
      id: courseToDelete.id,
      name: courseToDelete.name
    });

    // Check authentication state
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current user:', {
      id: session?.user?.id,
      email: session?.user?.email
    });

    // Verify course ownership
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('user_id')
      .eq('id', courseToDelete.id)
      .single();

    console.log('Course ownership check:', {
      courseData,
      courseError,
      userMatch: courseData?.user_id === session?.user?.id
    });

    setIsDeleting(true);
    try {
      const { data, error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id)
        .select();

      console.log('Delete response:', { 
        data, 
        error: deleteError,
        courseId: courseToDelete.id,
        userId: session?.user?.id
      });

      if (deleteError) throw deleteError;
      
      console.log('Course deleted successfully, refreshing courses...');
      
      // Refresh the courses list using the hook's refresh function
      await refreshCourses();
      
      // Remove the course from local state
      setCourseToDelete(null);
    } catch (err) {
      console.error('Error deleting course:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === 'active') return matchesSearch && course.status === 'active';
    if (selectedFilter === 'archived') return matchesSearch && course.status === 'archived';
    
    return matchesSearch;
  });

  if (isLoading) {
    return <div className="p-8">Loading courses...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="space-y-8">
      <CourseHeader onNewCourse={() => navigate('/courses/new')} />

      <CourseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />

      <div className="grid grid-cols-1 gap-4">
        {filteredCourses.map(course => (
          <CourseCard 
            key={course.id} 
            course={course} 
            onDelete={setCourseToDelete}
          />
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <EmptyState 
          message={
            searchQuery || selectedFilter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first course to get started'
          }
        />
      )}

      {courseToDelete && (
        <DeleteModal
          course={courseToDelete}
          onClose={() => setCourseToDelete(null)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
