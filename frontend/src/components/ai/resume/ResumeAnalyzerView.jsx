import React, { useState } from 'react';
import ResumeInputForm from './ResumeInputForm';
import ATSScoreCard from './ATSScoreCard';
import ResumeSuggestionsCard from './ResumeSuggestionsCard';
import aiService from '../../../services/ai/aiService';
import { AlertCircle, RotateCcw, Sparkles } from 'lucide-react';
import { extractErrorMessage } from '../../../utils/errorUtils';
import toast from 'react-hot-toast';

/**
 * ResumeAnalyzerView Component
 * Main orchestrator for Resume ATS Scoring and Gemini Improvement Suggestions.
 */
export default function ResumeAnalyzerView() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (payload) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await aiService.analyzeResume(payload);
      if (data?.status === 'SUCCESS' || data?.ats_score !== undefined || data?.overall_score !== undefined) {
        setAnalysisResult(data);
        const scoreVal = Math.round(data?.overall_score ?? data?.ats_score?.overall_score ?? (typeof data?.ats_score === 'number' ? data.ats_score : 0));
        toast.success(`Resume analyzed! ATS Score: ${scoreVal}/100`);
      } else {
        throw new Error(data?.message || 'Failed to complete resume analysis.');
      }
    } catch (err) {
      console.error('Resume analysis error:', err);
      const msg = extractErrorMessage(err, 'Failed to analyze resume. Please verify the file and job description.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleResetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Resume ATS Analyzer</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Automated applicant tracking scoring and impact phrasing enhancements
          </p>
        </div>

        {analysisResult && (
          <button
            type="button"
            onClick={handleResetAnalysis}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        )}
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input Form Section (Always accessible for rapid re-tweaking) */}
      <ResumeInputForm
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* ATS Score Card */}
          <ATSScoreCard result={analysisResult} />

          {/* AI Suggestions Card */}
          <ResumeSuggestionsCard result={analysisResult} />
        </div>
      )}
    </div>
  );
}
