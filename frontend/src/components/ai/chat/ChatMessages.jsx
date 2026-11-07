import React, { useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import { Bot, Sparkles, HelpCircle, Loader2 } from 'lucide-react';

/**
 * ChatMessages Component
 * Stream of conversation messages with auto-scrolling and rich empty starter questions.
 */
export default function ChatMessages({
  messages,
  isLoading,
  onSelectStarterPrompt,
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const starterPrompts = [
    {
      title: 'Super Dream Placement Rules',
      query: 'What are the eligibility criteria and rules for Super Dream placement drives at NSU?',
      category: 'PLACEMENT_CELL',
    },
    {
      title: 'CGPA & Backlog Policies',
      query: 'How are CGPA minimums, active backlogs, and academic year gaps evaluated during campus recruitment drives?',
      category: 'PLACEMENT_CELL',
    },
    {
      title: 'Summer Internship NOC Process',
      query: 'What is the step-by-step procedure to get an official NOC approved for summer internships?',
      category: 'NSU',
    },
    {
      title: 'Full-Stack Technical Interview Tips',
      query: 'Can you provide the top core concepts and coding patterns asked during Tier-1 technical software interviews?',
      category: 'INTERVIEW_PREP',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4 sm:p-5 min-h-[380px] max-h-[560px] no-scrollbar">
      {/* Empty State: Starter Prompts */}
      {messages.length === 0 && (
        <div className="py-6 sm:py-8 space-y-6 text-center max-w-xl mx-auto">
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              How can I assist you today?
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ask anything about NSU academic regulations, placement cell drives, summer internships, or interview preparation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
            {starterPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectStarterPrompt(prompt.query, prompt.category)}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group cursor-pointer shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-blue-600">
                  <span>{prompt.title}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {prompt.query}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Stream */}
      {messages.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} />
      ))}

      {/* Loading / Thinking Indicator */}
      {isLoading && (
        <div className="flex items-start gap-3 pr-10 animate-in fade-in-50 duration-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
            <Bot className="w-4 h-4 text-amber-300" />
          </div>

          <div className="bg-white rounded-2xl rounded-tl-xs border border-slate-200/90 p-4 shadow-2xs flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800">
                Searching university guidelines & documents...
              </span>
              <p className="text-[11px] text-slate-400">
                Synthesizing verified response
              </p>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
