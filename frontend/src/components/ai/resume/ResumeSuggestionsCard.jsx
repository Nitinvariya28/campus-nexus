import React, { useState } from 'react';
import { 
  Sparkles, 
  Tag, 
  Lightbulb, 
  CheckCircle2, 
  ArrowRight, 
  BookOpen, 
  Flame, 
  Copy, 
  Check,
  Layers,
  FileText,
  Target,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ResumeSuggestionsCard Component
 * High-impact, realistic ATS & recruiter enhancement advice:
 * 1. Targeted Executive Summary rewrite
 * 2. Google XYZ Formula Bullet Rewrites with quantified metrics
 * 3. Priority Missing Keywords with contextual placement advice
 * 4. Structural & Formatting optimizations for automated parsers
 * 5. Verifiable identified strengths
 */
export default function ResumeSuggestionsCard({ result }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!result) return null;

  // 1. Missing keywords priority
  const rawKw = result?.ai_suggestions?.missing_keywords_priority || result?.missing_keywords || {};
  let missingKeywords = [];
  if (Array.isArray(rawKw)) {
    missingKeywords = rawKw.map((k) => (typeof k === 'string' ? { keyword: k, importance: 'HIGH' } : k));
  } else if (typeof rawKw === 'object' && rawKw !== null) {
    const high = Array.isArray(rawKw.high) ? rawKw.high.map((k) => ({ keyword: k, importance: 'HIGH' })) : [];
    const medium = Array.isArray(rawKw.medium) ? rawKw.medium.map((k) => ({ keyword: k, importance: 'MEDIUM' })) : [];
    missingKeywords = [...high, ...medium];
  }

  // 2. Keyword placement advice
  const placementAdvice = Array.isArray(result?.ai_suggestions?.keyword_placement_advice)
    ? result.ai_suggestions.keyword_placement_advice
    : (Array.isArray(result?.keyword_placement_advice) ? result.keyword_placement_advice : []);

  // 3. Executive summary recommendation
  const summaryRec = result?.ai_suggestions?.summary_recommendation || (Array.isArray(result?.recommendations) ? result.recommendations[0] : '');

  // 4. Bullet rewrites
  const bulletRewrites = Array.isArray(result?.ai_suggestions?.bullet_point_improvements)
    ? result.ai_suggestions.bullet_point_improvements
    : (Array.isArray(result?.tailored_bullet_suggestions) ? result.tailored_bullet_suggestions : []);

  // 5. Structural suggestions
  const structuralSuggestions = Array.isArray(result?.ai_suggestions?.structural_suggestions)
    ? result.ai_suggestions.structural_suggestions
    : (Array.isArray(result?.structural_suggestions) ? result.structural_suggestions : []);

  // 6. Strengths
  const strengths = Array.isArray(result?.ai_suggestions?.strengths)
    ? result.ai_suggestions.strengths
    : (Array.isArray(result?.strengths) ? result.strengths : []);

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Advice' },
    { id: 'BULLETS', label: `XYZ Rewrites (${bulletRewrites.length})` },
    { id: 'KEYWORDS', label: `Keywords (${missingKeywords.length})` },
    { id: 'STRUCTURE', label: `Formatting & Layout (${structuralSuggestions.length || 3})` },
    { id: 'STRENGTHS', label: `Strengths (${strengths.length})` },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Actionable Resume Enhancement Plan</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Targeted adjustments engineered to maximize automated ATS parsing accuracy and recruiter callbacks
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 sm:pt-0">
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Tailored Summary / Headline Recommendation */}
      {(activeFilter === 'ALL' || activeFilter === 'STRUCTURE') && summaryRec && (
        <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5 uppercase tracking-wider">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Recommended Role Headline / Summary</span>
            </span>
            <button
              type="button"
              onClick={() => handleCopyText(summaryRec, 'summary')}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {copiedIndex === 'summary' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Headline</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
            "{summaryRec}"
          </p>
        </div>
      )}

      {/* 2. Google XYZ Formula Bullet Rewrites */}
      {(activeFilter === 'ALL' || activeFilter === 'BULLETS') && bulletRewrites.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Google XYZ High-Impact Bullet Rewrites
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Accomplished [X] measured by [Y], by doing [Z]
            </span>
          </div>

          <div className="space-y-3.5">
            {bulletRewrites.map((bullet, idx) => {
              const copyKey = `bullet_${idx}`;
              const isCopied = copiedIndex === copyKey;

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-2xs space-y-3 transition-colors"
                >
                  {/* Section Tag & Metric Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {bullet.section || 'Projects / Technical Experience'}
                    </span>
                    {bullet.metric && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <span>🎯 Impact:</span>
                        <span>{bullet.metric}</span>
                      </span>
                    )}
                  </div>

                  {/* Before & After Comparison */}
                  <div className="space-y-2">
                    {bullet.original && (
                      <div className="text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                          Original Phrasing:
                        </span>
                        <p className="text-slate-500 line-through italic pl-2.5 border-l-2 border-slate-300 text-xs">
                          {bullet.original}
                        </p>
                      </div>
                    )}

                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                          High-Impact Optimized Phrasing:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(bullet.improved, copyKey)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer bg-emerald-100/60 hover:bg-emerald-100 px-2 py-0.5 rounded-md transition-colors"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Rewrite</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-slate-900 font-medium bg-emerald-50/80 text-emerald-950 p-3 rounded-lg border border-emerald-200 leading-relaxed text-xs sm:text-sm">
                        {bullet.improved}
                      </p>
                    </div>
                  </div>

                  {/* Rationale */}
                  {bullet.reason && (
                    <div className="text-[11px] text-slate-600 flex items-start gap-1.5 pt-2 border-t border-slate-100">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed"><strong>Why it works:</strong> {bullet.reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Missing Keywords & Strategic Placement */}
      {(activeFilter === 'ALL' || activeFilter === 'KEYWORDS') && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Priority Missing Keywords & Where to Add Them
            </h4>
          </div>

          {missingKeywords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {missingKeywords.map((item, idx) => {
                const kwName = typeof item === 'string' ? item : item.keyword;
                const isHigh = item.importance === 'HIGH';

                // Look up matching placement advice
                const advice = placementAdvice.find((p) => p.keyword?.toLowerCase() === kwName?.toLowerCase());

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {kwName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                          isHigh
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isHigh ? 'High Impact' : 'Nice to Have'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {advice ? advice.action : `Add to your Technical Skills section and mention practical usage in your primary project implementation.`}
                    </p>

                    {advice?.recommended_section && (
                      <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                        📍 Target: <span className="text-slate-800 font-semibold">{advice.recommended_section}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              Great match! No critical missing technical keywords identified for this target job description.
            </p>
          )}
        </div>
      )}

      {/* 4. Structural & Formatting Suggestions */}
      {(activeFilter === 'ALL' || activeFilter === 'STRUCTURE') && structuralSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Formatting & ATS Architecture Suggestions
            </h4>
          </div>

          <div className="space-y-2">
            {structuralSuggestions.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-slate-200 bg-white flex items-start gap-2.5 text-xs text-slate-800"
              >
                <div className="p-1 rounded-md bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold text-slate-900 block">
                    {item.category}:
                  </span>
                  <p className="text-slate-600 leading-relaxed text-xs">
                    {item.suggestion}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Identified Strengths */}
      {(activeFilter === 'ALL' || activeFilter === 'STRENGTHS') && strengths.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verified Candidate Strengths
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strengths.map((str, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-xs text-emerald-950 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/80"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium text-xs leading-snug">{str}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
