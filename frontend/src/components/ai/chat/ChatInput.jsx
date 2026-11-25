import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp, CornerDownLeft, Sparkles, Loader2 } from 'lucide-react';

/**
 * ChatInput Component
 * ChatGPT-style floating bottom input bar with auto-expanding textarea,
 * Enter-to-send support, and responsive clean disclaimer.
 */
export default function ChatInput({ onSendMessage, isLoading }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height smoothly up to max 160px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const canSend = text.trim().length > 0 && !isLoading;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-2">
      {/* Floating Input Pill */}
      <div className="relative flex items-end bg-white rounded-2xl sm:rounded-3xl border border-slate-300 shadow-sm focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-100 transition-all p-1.5 sm:p-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about placement drives, academic regulations, or interview prep..."
          disabled={isLoading}
          className="flex-1 max-h-40 resize-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent py-2 px-3 sm:px-4 font-normal leading-relaxed disabled:opacity-60"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
            canSend
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:scale-105 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
          }`}
          title={isLoading ? 'Generating response...' : 'Send message (Enter)'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
          ) : (
            <ArrowUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Footer Disclaimer & Key Hint */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-3">
        <span className="hidden sm:inline-flex items-center gap-1.5">
          <CornerDownLeft className="w-3 h-3 text-slate-400" />
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for newline</span>
        </span>
        <span className="text-center sm:text-right w-full sm:w-auto text-[11px] text-slate-400">
          AI answers grounded in Nirma University documents
        </span>
      </div>
    </div>
  );
}
