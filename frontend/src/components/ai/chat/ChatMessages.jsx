import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Bot, Sparkles, Loader2, ArrowRight } from 'lucide-react';

/**
 * ChatMessages Component
 * Stream of conversation messages with auto-scrolling, starter prompts,
 * and realistic ChatGPT-style search thinking status.
 */
export default function ChatMessages({
  messages,
  isLoading,
  onSelectStarterPrompt,
  onSelectFollowup,
}) {
  const bottomRef = useRef(null);

  // Auto-scroll on new messages or during loading
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterPrompts = [
    {
      title: 'Super Dream Placement Rules',
      query: 'What are the eligibility criteria and rules for Super Dream placement drives at Nirma University?',
      category: 'PLACEMENT_CELL',
    },
    {
      title: 'CGPA & Backlog Policies',
      query: 'How are CGPA minimums, active backlogs, and academic year gaps evaluated during campus recruitment drives?',
      category: 'PLACEMENT_CELL',
    },
    {
      title: 'Summer Internship NOC Process',
      query: 'What is the step-by-step procedure to get an official NOC approved for summer internships at Nirma University?',
      category: 'NIRMA',
    },
    {
      title: 'System Design Interview Topics',
      query: 'What are the most common system design questions for freshers?',
      category: 'INTERVIEW_PREP',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 no-scrollbar">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Empty State: ChatGPT Starter Cards */}
        {messages.length === 0 && (
          <div className="py-8 sm:py-12 space-y-8 text-center animate-in fade-in-50 duration-300">
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                How can I help you today?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
                Ask about official Nirma University regulations, placement cell tiers, attendance policies, summer internships, or technical interview prep.
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectStarterPrompt(prompt.query, prompt.category)}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-400 hover:bg-blue-50/30 text-left transition-all duration-200 group cursor-pointer shadow-2xs hover:shadow-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-blue-600">
                    <span>{prompt.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {prompt.query}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        {messages.map((msg, idx) => (
          <ChatMessage
            key={idx}
            message={msg}
            onSelectFollowup={onSelectFollowup}
            onContentUpdate={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
          />
        ))}

        {/* Realistic Search & Synthesizing State (ChatGPT/Perplexity Style) */}
        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in-50 duration-200">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Sparkles className="w-4 h-4 text-white animate-spin" />
            </div>

            <div className="bg-white rounded-2xl rounded-tl-xs border border-slate-200/80 p-3.5 sm:p-4 shadow-2xs space-y-1.5 max-w-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">
                  Searching Nirma University knowledge base...
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pl-5">
                Synthesizing verified answer with official guidelines
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
