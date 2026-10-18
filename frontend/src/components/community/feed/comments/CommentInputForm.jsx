import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

/**
 * CommentInputForm Component
 * Section 6.1 of AlumiBridge_post.docx:
 * - Current user avatar on the left
 * - Text input: "Write a comment..."
 * - Send icon button on the right
 * - Prevents empty submissions & shows loading spinner during submit
 */
export default function CommentInputForm({ onSubmit, isSubmitting = false }) {
  const [content, setContent] = useState('');

  // Retrieve current user from localStorage for avatar display
  let currentUser = null;
  try {
    const raw = localStorage.getItem('user');
    if (raw) currentUser = JSON.parse(raw);
  } catch {
    currentUser = null;
  }

  const userInitial = currentUser?.first_name
    ? currentUser.first_name.charAt(0).toUpperCase()
    : currentUser?.email
    ? currentUser.email.charAt(0).toUpperCase()
    : 'U';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    if (onSubmit) {
      const success = await onSubmit(trimmed);
      if (success !== false) {
        setContent('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2.5 pt-1">
      {/* User Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-2xs">
        {userInitial}
      </div>

      {/* Input Field & Submit Action */}
      <div className="relative flex-1">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          disabled={isSubmitting}
          className="w-full pl-3.5 pr-10 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors disabled:text-slate-300 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
          title="Send Comment"
          aria-label="Send Comment"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}
