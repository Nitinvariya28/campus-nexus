import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

/**
 * ChatInput Component
 * Multiline message composer with Enter-to-send and Shift+Enter newline support.
 */
export default function ChatInput({ onSendMessage, isLoading }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs space-y-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about NSU placement rules, internships, or interview preparation (Enter to send)..."
          disabled={isLoading}
          className="flex-1 max-h-36 resize-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent py-1.5 px-2 font-normal leading-relaxed"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-xs shrink-0"
          title="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 border-t border-slate-100 pt-1.5">
        <span className="hidden sm:inline flex items-center gap-1">
          <CornerDownLeft className="w-3 h-3 text-slate-400" />
          <span>Press <strong>Enter</strong> to send, <strong>Shift + Enter</strong> for new line</span>
        </span>
        <span className="text-2xs text-slate-400 ml-auto">
          {text.length > 0 ? `${text.length} characters` : 'AI answers grounded in official documents'}
        </span>
      </div>
    </div>
  );
}
