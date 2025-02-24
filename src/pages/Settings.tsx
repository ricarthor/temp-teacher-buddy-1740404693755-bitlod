import React from 'react';
import { Building2, User, Puzzle, CreditCard, Sparkles, ExternalLink } from 'lucide-react';

export function Settings() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1e293b] mb-2">Settings</h1>
        <p className="text-[#64748b]">Manage your account, integrations, and preferences</p>
      </div>

      {/* Organization Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-[#1e293b]">Organization</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Organization Name
            </label>
            <input
              type="text"
              placeholder="Enter organization name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Domain
            </label>
            <input
              type="text"
              placeholder="your-domain.edu"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-[#1e293b]">Teacher Profile</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Department
            </label>
            <input
              type="text"
              placeholder="Enter your department"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#1e293b] mb-2">
              Role
            </label>
            <input
              type="text"
              placeholder="Teacher"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
        </div>
      </div>

      {/* Integrations Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Puzzle className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-[#1e293b]">Integrations</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src="https://www.moodle.org/theme/moodleorg/pix/moodle_logo.svg"
                alt="Moodle"
                className="w-8 h-8"
              />
              <div>
                <h3 className="font-medium text-[#1e293b]">Moodle</h3>
                <p className="text-sm text-[#64748b]">Import your courses and students</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">Coming Soon</span>
              <ExternalLink className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src="https://www.blackboard.com/themes/custom/blackboard/images/bb_logo.svg"
                alt="Blackboard"
                className="w-8 h-8"
              />
              <div>
                <h3 className="font-medium text-[#1e293b]">Blackboard</h3>
                <p className="text-sm text-[#64748b]">Sync your class data</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">Coming Soon</span>
              <ExternalLink className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src="https://static.canva.com/web/images/12487a1e0770d29351bd4ce4f87ec8fe.svg"
                alt="Canva"
                className="w-8 h-8"
              />
              <div>
                <h3 className="font-medium text-[#1e293b]">Canva</h3>
                <p className="text-sm text-[#64748b]">Create beautiful quiz materials</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">Coming Soon</span>
              <ExternalLink className="w-4 h-4 text-[#64748b]" />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-[#1e293b]">Subscription</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-2">Basic</h3>
            <div className="text-3xl font-bold text-[#1e293b] mb-4">
              Free
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Up to 3 courses
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Basic analytics
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Email support
              </li>
            </ul>
            <button className="w-full px-4 py-2 text-sm font-medium text-[#2563eb] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors" disabled>
              Current Plan
            </button>
          </div>

          <div className="border-2 border-blue-600 rounded-xl p-6 relative">
            <div className="absolute -top-3 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              Popular
            </div>
            <h3 className="text-lg font-semibold text-[#1e293b] mb-2">Pro</h3>
            <div className="text-3xl font-bold text-[#1e293b] mb-4">
              $29<span className="text-lg font-normal text-[#64748b]">/mo</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Unlimited courses
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Advanced analytics
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Priority support
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Basic AI features
              </li>
            </ul>
            <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors" disabled>
              Upgrade
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#1e293b] mb-2">Enterprise</h3>
            <div className="text-3xl font-bold text-[#1e293b] mb-4">
              $99<span className="text-lg font-normal text-[#64748b]">/mo</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Everything in Pro
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Custom integrations
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Dedicated support
              </li>
              <li className="flex items-center gap-2 text-sm text-[#64748b]">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                Full AI capabilities
              </li>
            </ul>
            <button className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors" disabled>
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* AI Features Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-[#1e293b]">AI Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-[#1e293b] mb-2">Quiz Generation</h3>
            <p className="text-sm text-[#64748b] mb-4">
              Generate quizzes automatically from your course materials
            </p>
            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
              Pro & Enterprise
            </span>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-[#1e293b] mb-2">Performance Insights</h3>
            <p className="text-sm text-[#64748b] mb-4">
              AI-powered analysis of student performance patterns
            </p>
            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
              Enterprise Only
            </span>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-[#1e293b] mb-2">Content Recommendations</h3>
            <p className="text-sm text-[#64748b] mb-4">
              Smart suggestions for quiz content and difficulty
            </p>
            <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-sm">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
