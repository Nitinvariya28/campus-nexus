import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundaryCard Component
 * Displayed when an analytics API request fails.
 */
export default function ErrorBoundaryCard({
  title = 'Failed to Load Analytics',
  message = 'An error occurred while fetching the latest analytics data from the server.',
  onRetry,
}) {
  return (
    <div className="bg-rose-50/50 p-8 rounded-xl border border-rose-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-rose-900">{title}</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
}
