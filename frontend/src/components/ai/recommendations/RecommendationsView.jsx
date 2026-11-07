import React, { useState, useEffect, useCallback } from 'react';
import aiService from '../../../services/ai/aiService';
import StudentRecommendations from './StudentRecommendations';
import AlumniRecommendations from './AlumniRecommendations';
import ColdStartIncomplete from './ColdStartIncomplete';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { extractErrorMessage } from '../../../utils/errorUtils';

/**
 * RecommendationsView Component
 * Two horizontally stacked sections (Students on top, Alumni on bottom).
 * Features independent pagination and graceful cold-start handling.
 */
export default function RecommendationsView() {
  const [studentPage, setStudentPage] = useState(1);
  const [alumniPage, setAlumniPage] = useState(1);

  const [studentData, setStudentData] = useState(null);
  const [alumniData, setAlumniData] = useState(null);

  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [isAlumniLoading, setIsAlumniLoading] = useState(true);

  const [isIncompleteProfile, setIsIncompleteProfile] = useState(false);
  const [incompleteMessage, setIncompleteMessage] = useState('');
  const [error, setError] = useState(null);

  // Fetch student recommendations
  const fetchStudents = useCallback(async (pageToLoad) => {
    setIsStudentLoading(true);
    try {
      const res = await aiService.getProfileRecommendations({
        target_role: 'STUDENT',
        student_page: pageToLoad,
        page_size: 5,
      });

      if (res?.status === 'PROFILE_INCOMPLETE' && !res?.students?.items?.length) {
        setIsIncompleteProfile(true);
        setIncompleteMessage(res.message);
        return;
      }

      setStudentData(res?.students || res?.student_recommendations || null);
    } catch (err) {
      console.error('Failed to load student recommendations:', err);
      setError(extractErrorMessage(err, 'Failed to fetch student recommendations.'));
    } finally {
      setIsStudentLoading(false);
    }
  }, []);

  // Fetch alumni recommendations
  const fetchAlumni = useCallback(async (pageToLoad) => {
    setIsAlumniLoading(true);
    try {
      const res = await aiService.getProfileRecommendations({
        target_role: 'ALUMNI',
        alumni_page: pageToLoad,
        page_size: 5,
      });

      if (res?.status === 'PROFILE_INCOMPLETE' && !res?.alumni?.items?.length) {
        setIsIncompleteProfile(true);
        setIncompleteMessage(res.message);
        return;
      }

      setAlumniData(res?.alumni || res?.alumni_recommendations || null);
    } catch (err) {
      console.error('Failed to load alumni recommendations:', err);
      setError(extractErrorMessage(err, 'Failed to fetch alumni recommendations.'));
    } finally {
      setIsAlumniLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchStudents(1);
    fetchAlumni(1);
  }, [fetchStudents, fetchAlumni]);

  const handleStudentPageChange = (newPage) => {
    setStudentPage(newPage);
    fetchStudents(newPage);
  };

  const handleAlumniPageChange = (newPage) => {
    setAlumniPage(newPage);
    fetchAlumni(newPage);
  };

  const handleRefreshAll = () => {
    setError(null);
    setIsIncompleteProfile(false);
    setStudentPage(1);
    setAlumniPage(1);
    fetchStudents(1);
    fetchAlumni(1);
  };

  // If user profile is incomplete
  if (isIncompleteProfile) {
    return <ColdStartIncomplete message={incompleteMessage} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Profile Recommendations</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Personalized peer discovery matching your academic department, skills, and career interests
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshAll}
          title="Refresh recommendations"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 text-slate-700 hover:text-blue-600 hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Global Error Banner (if any) */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefreshAll}
            className="text-xs font-bold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* UPPER SECTION: Top 5 Student Recommendations */}
      <StudentRecommendations
        data={studentData}
        isLoading={isStudentLoading}
        page={studentPage}
        onPageChange={handleStudentPageChange}
      />

      {/* LOWER SECTION: Top 5 Alumni Recommendations */}
      <AlumniRecommendations
        data={alumniData}
        isLoading={isAlumniLoading}
        page={alumniPage}
        onPageChange={handleAlumniPageChange}
      />
    </div>
  );
}
