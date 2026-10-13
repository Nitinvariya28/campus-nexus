import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800">
      {/* Sticky Master Top Navbar */}
      <Navbar />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Small Minimal Footer (No Navbar Navigation Links) */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="AlumiBridge" className="w-5 h-5" />
            <span className="font-semibold text-slate-700">AlumiBridge</span>
            <span>·</span>
            <span>Nirma University Campus Nexus</span>
          </div>
          <div>
            <p>© 2026 AlumiBridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
