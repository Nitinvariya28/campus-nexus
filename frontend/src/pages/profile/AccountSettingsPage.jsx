import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert, KeyRound, BellRing } from 'lucide-react';

export default function AccountSettingsPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account & Security Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your credentials, login sessions, and privacy preferences.
        </p>

        <div className="mt-8 space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <KeyRound className="w-5 h-5 text-slate-700" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Change Password</h4>
                <p className="text-xs text-slate-500">Update your account password regularly for security.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Protected
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BellRing className="w-5 h-5 text-slate-700" />
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Notification Preferences</h4>
                <p className="text-xs text-slate-500">Configure email alerts and campus announcement notifications.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-200/70 px-3 py-1 rounded-full">
              Configurable
            </span>
          </div>
        </div>

        {/* Secure Logout Section */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-600">Active Session</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Signed in as <span className="font-semibold text-slate-700">{user?.email || 'Active User'}</span>
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm px-4 py-2 rounded-lg border border-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4 text-red-600" />
            <span>Logout from AlumiBridge</span>
          </button>
        </div>
      </div>
    </div>
  );
}
