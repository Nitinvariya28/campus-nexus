import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

/**
 * Enterprise React Error Boundary for Analytics Dashboards
 * Catches any uncaught rendering errors in any visualization or KPI card,
 * preventing blank white screens and rendering an actionable fallback card.
 */
export default class AnalyticsErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AnalyticsErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-2xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Analytics View Encountered an Issue
            </h2>
            <p className="text-xs text-slate-500">
              {this.state.error?.message || 'A runtime error occurred while rendering this dashboard.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reload View</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
