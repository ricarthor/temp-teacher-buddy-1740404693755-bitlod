import React, { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface ShareCourseModalProps {
  courseId: string;
  courseName: string;
  onClose: () => void;
}

export function ShareCourseModal({ courseId, courseName, onClose }: ShareCourseModalProps) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSharing(true);
    setError(null);
    setSuccess(false);

    try {
      // Fixed parameter order to match the function definition
      const { data, error: shareError } = await supabase
        .rpc('share_course', {
          p_course_id: courseId,
          p_email: email,
          p_access_type: 'viewer'
        });

      if (shareError) {
        console.error('Share error:', shareError);
        throw shareError;
      }

      if (data === null) {
        throw new Error('Failed to share course');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to share course');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('Share course error:', err);
      setError(err.message || 'Failed to share course');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-[#1e293b]">Share Course</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[#64748b] mb-4">
          Share <span className="font-medium text-[#1e293b]">{courseName}</span> with other users
        </p>

        <form onSubmit={handleShare} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
              Course shared successfully!
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
              disabled={isSharing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSharing}
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSharing ? 'Sharing...' : 'Share Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
