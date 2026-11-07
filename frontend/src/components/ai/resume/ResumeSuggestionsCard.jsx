import React from 'react';
import { 
  Sparkles, 
  Tag, 
  Lightbulb, 
  CheckCircle, 
  ArrowRight, 
  BookOpen, 
  Flame, 
  Copy, 
  Check 
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ResumeSuggestionsCard Component
 * Displays actionable resume recommendations powered by Gemini:
 * 1. Missing keywords with priority badges (HIGH/MEDIUM) & context
 * 2. Google XYZ formula bullet rewrites (Original vs Improved vs Reason)
 * 3. Specific improvement recommendations
 * 4. Key strengths
 */
export default function ResumeSuggestionsCard({ result }) {
  if (!result) return null;

  // Extract missing keywords handling both array and { high: [], medium: [] }
  const rawKw = result?.ai_suggestions?.missing_keywords_priority || result?.missing_keywords || [];
  let missingKeywords = [];
  if (Array.isArray(rawKw)) {
    missingKeywords = rawKw;
  } else if (typeof rawKw === 'object' && rawKw !== null) {
    const high = Array.isArray(rawKw.high) ? rawKw.high.map((k) => ({ keyword: k, importance: 'HIGH' })) : [];
    const medium = Array.isArray(rawKw.medium) ? rawKw.medium.map((k) => ({ keyword: k, importance: 'MEDIUM' })) : [];
    missingKeywords = [...high, ...medium];
  }

  // Recommendations
  let recommendations = [];
  if (Array.isArray(result?.recommendations) && result.recommendations.length > 0) {
    recommendations = result.recommendations;
  } else if (result?.ai_suggestions?.summary_recommendation) {
    recommendations = [result.ai_suggestions.summary_recommendation];
  }

  // Bullet improvements
  const tailoredBullets = Array.isArray(result?.ai_suggestions?.bullet_point_improvements)
    ? result.ai_suggestions.bullet_point_improvements
    : (Array.isArray(result?.tailored_bullet_suggestions) ? result.tailored_bullet_suggestions : []);

  // Strengths
  const strengths = Array.isArray(result?.ai_suggestions?.strengths)
    ? result.ai_suggestions.strengths
    : (Array.isArray(result?.strengths) ? result.strengths : []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied bullet rewrite to clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-7">
      {/* Header */}
      <div className="pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>AI Resume Enhancement Suggestions</span>
          <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
            <Sparkles className="w-4 h-4" />
          </span>
        </h3>
        <p className="text-xs text-slate-500">
          Prioritized recommendations to beat applicant tracking systems and impress hiring managers
        </p>
      </div>

      {/* 1. Missing Keywords Section */}
      {missingKeywords.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Critical Missing Keywords
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {missingKeywords.map((item, idx) => {
              const keyword = typeof item === 'string' ? item : item.keyword;
              const importance = typeof item === 'object' && item.importance ? item.importance.toUpperCase() : 'HIGH';
              const context = typeof item === 'object' ? item.context : null;

              const isHigh = importance === 'HIGH' || importance === 'CRITICAL';

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/60 flex flex-col justify-between space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {keyword}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                        isHigh
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {importance}
                    </span>
                  </div>

                  {context && (
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {context}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Google XYZ Formula Bullet Rewrites */}
      {tailoredBullets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                High-Impact Achievement Rewrites
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Accomplished [X], as measured by [Y], by doing [Z]
            </span>
          </div>

          <div className="space-y-3">
            {tailoredBullets.map((bullet, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-2xs space-y-3 transition-colors"
              >
                {/* Original vs Improved */}
                <div className="space-y-2">
                  {bullet.original && (
                    <div className="text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Original Phrasing:
                      </span>
                      <p className="text-slate-500 line-through italic pl-2 border-l-2 border-slate-300">
                        {bullet.original}
                      </p>
                    </div>
                  )}

                  <div className="text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                        High-Impact XYZ Phrasing:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(bullet.improved)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <p className="text-slate-900 font-medium bg-emerald-50/70 text-emerald-950 p-2.5 rounded-lg border border-emerald-200/80 leading-relaxed">
                      {bullet.improved}
                    </p>
                  </div>
                </div>

                {/* Reason Explanation */}
                {bullet.reason && (
                  <div className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1 border-t border-slate-100">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{bullet.reason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Strategic Recommendations
            </h4>
          </div>

          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-100"
              >
                <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. Identified Resume Strengths */}
      {strengths.length > 0 && (
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Identified Strengths
            </h4>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strengths.map((str, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 text-xs text-emerald-900 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium truncate">{str}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
