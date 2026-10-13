import React from 'react';
import { Layers, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PlaceholderCard({ 
  moduleName, 
  title, 
  route, 
  description, 
  endpoints = [] 
}) {
  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs">
        {/* Module Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Module: {moduleName}
            </span>
          </div>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
            Route Shell Active
          </span>
        </div>

        {/* Title & Route */}
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-sm font-mono text-slate-500 mt-1 bg-slate-50 px-2.5 py-1 rounded inline-block">
          URL: {route}
        </p>

        {description && (
          <p className="text-sm text-slate-600 mt-4 leading-relaxed">{description}</p>
        )}

        {/* Associated Backend Endpoints */}
        {endpoints.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Associated Backend APIs
            </h3>
            <ul className="space-y-1.5">
              {endpoints.map((ep, idx) => (
                <li key={idx} className="text-xs font-mono text-slate-700 flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>{ep}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </Link>
          <span className="text-xs text-slate-400">AlumiBridge Modular Architecture</span>
        </div>
      </div>
    </div>
  );
}
