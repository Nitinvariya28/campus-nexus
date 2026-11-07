import React from 'react';
import { Users, FileText, Bot, Sparkles, ChevronRight } from 'lucide-react';

/**
 * AISidebar Component
 * Clean, simple navigation sidebar for AI Mode:
 * - Simple options without cramped badges
 * - Full un-truncated labels and smooth active state
 * - Clean responsive mobile bar
 */
export default function AISidebar({ activeTab, onSelectTab }) {
  const tabs = [
    {
      id: 'recommendations',
      label: 'Recommendations',
      icon: Users,
      description: 'Peer & alumni match discovery',
    },
    {
      id: 'resume',
      label: 'Resume Analyzer',
      icon: FileText,
      description: 'ATS scoring & bullet enhancements',
    },
    {
      id: 'chat',
      label: 'Chatbot',
      icon: Bot,
      description: 'University guidance & interview Q&A',
    },
  ];

  return (
    <aside className="w-full">
      {/* 1. Mobile Segmented Tab Bar */}
      <div className="md:hidden mb-4 bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Desktop & Tablet: Clean Vertical Sidebar Card */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs space-y-2">
        {/* Header Title */}
        <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">AI Services</h3>
            <p className="text-[11px] text-slate-400">Campus assistance tools</p>
          </div>
        </div>

        {/* Navigation List - Clean & Simple */}
        <nav className="space-y-1 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={`w-full group flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`block text-xs font-bold ${
                      isActive ? 'text-blue-900' : 'text-slate-800 group-hover:text-blue-600'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <span className="block text-[11px] text-slate-400 font-normal truncate mt-0.5">
                    {tab.description}
                  </span>
                </div>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-all ${
                    isActive ? 'text-blue-600 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
