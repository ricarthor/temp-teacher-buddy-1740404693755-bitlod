import React from 'react';
import { Users, BookOpen, MessageSquare, Flag, GraduationCap, LogOut, Home, TrendingUp, PlusSquare, Library, Settings } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ThemeSelector } from './ThemeSelector';

const courseNavItems = [
  { icon: Users, label: 'Students', path: '/students' },
  { icon: TrendingUp, label: 'Quiz Management', path: '/progress' },
  { icon: GraduationCap, label: 'Teacher Hub', path: '/teacher-hub' },
  // { icon: MessageSquare, label: 'Feedback', path: '/feedback' },
  // { icon: Flag, label: 'Flagged', path: '/flagged' },
];

const rootNavItems = [
  { icon: GraduationCap, label: 'Courses', href: '/courses' },
  { icon: Library, label: 'My Quizzes', href: '/quizzes' },
  { icon: PlusSquare, label: 'Create Quiz', href: '/create-quiz' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathParts = location.pathname.split('/');
  const isCourseRoute = pathParts[1] === 'courses' && pathParts.length > 2 && pathParts[2] !== 'new';
  const courseId = isCourseRoute ? pathParts[2] : null;

  const navItems = isCourseRoute
    ? courseNavItems.map(item => ({
        ...item,
        href: `/courses/${courseId}${item.path}`,
      }))
    : rootNavItems;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <nav className="w-64 bg-card border-r border-default flex flex-col flex-shrink-0">
        {/* Logo and main navigation */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 p-6">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">QuizTracker</span>
          </div>
          <div className="flex-1 px-4 pb-4 overflow-y-auto">
            <div className="space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-primary bg-blue-50 dark:bg-blue-900/20'
                        : 'text-textSecondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom navigation */}
        <div className="p-4 border-t border-default flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <ThemeSelector />
          </div>
          {isCourseRoute && (
            <NavLink
              to="/courses"
              className="flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-2"
            >
              <Home className="w-5 h-5" />
              <span>My Courses</span>
            </NavLink>
          )}
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-2"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-2 py-2 text-textSecondary hover:text-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
