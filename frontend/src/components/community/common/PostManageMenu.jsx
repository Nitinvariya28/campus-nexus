import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';

/**
 * PostManageMenu Component
 * Accessible 3-dots action menu rendered only in manage mode.
 * Provides "Edit Post" and "Delete Post" actions with click-outside detection.
 */
export default function PostManageMenu({ onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen((prev) => !prev);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    onEdit?.();
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    onDelete?.();
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* 3-dots Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Post actions menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-1 w-40 origin-top-right rounded-xl bg-white shadow-lg border border-slate-200/90 py-1.5 z-30 focus:outline-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleEditClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
            <span>Edit Post</span>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            role="menuitem"
            onClick={handleDeleteClick}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Delete Post</span>
          </button>
        </div>
      )}
    </div>
  );
}
