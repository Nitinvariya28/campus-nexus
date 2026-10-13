import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CheckCircle2, Server, Layout, ShieldCheck, Rocket } from 'lucide-react';

export default function App() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AlumiBridge Frontend</h1>
              <p className="text-sm text-slate-500">React + Vite + Tailwind CSS Architecture</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-emerald-900">Environment & Installation Configured</h2>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Vite bundler, Tailwind CSS design system, React Router DOM, and Axios HTTP client initialized.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
              <Server className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-slate-800">Connected Backend API</h2>
                <code className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
                  {apiUrl}
                </code>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="text-sm font-semibold text-slate-800">JWT Interceptor Active</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Automatic Authorization headers with auto-refresh mechanism on 401 Unauthorized responses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}
