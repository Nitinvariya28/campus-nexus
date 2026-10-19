import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Award,
  Briefcase,
  Megaphone,
  X,
  ArrowLeft,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useCommunityStats } from '../../../context/CommunityStatsContext';
import { usePostOptions } from '../../../hooks/community/usePostOptions';
import { createCommunityPost, updateCommunityPost } from '../../../services/community/communityService';
import StandardPostForm from './forms/StandardPostForm';
import InterviewExperienceForm from './forms/InterviewExperienceForm';
import OpportunityForm from './forms/OpportunityForm';
import AnnouncementForm from './forms/AnnouncementForm';

/**
 * CreatePostModal / CreatePostOrchestrator
 * High-performance, role-adaptive container for creating and editing community entities.
 * Sleek, compact horizontal creation mode switcher without bulky KPI cards.
 */
export default function CreatePostModal({
  isOpen = true,
  onClose,
  onPostCreated,
  onPostUpdated,
  isStandalonePage = false,
  initialPost = null,
  mode = 'create',
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { adjustPosts } = useCommunityStats();
  const { options, isLoading } = usePostOptions();

  const isEdit = mode === 'edit';

  const getInitialType = () => {
    if (!initialPost) return 'STANDARD_POST';
    const t = (initialPost.feed_type || initialPost.entity_type || '').toUpperCase();
    if (t === 'POST') return 'STANDARD_POST';
    if (['STANDARD_POST', 'INTERVIEW_EXPERIENCE', 'OPPORTUNITY', 'ANNOUNCEMENT'].includes(t)) {
      return t;
    }
    return 'STANDARD_POST';
  };

  // Active entity type (defaults to STANDARD_POST or initialPost's type)
  const [activeEntityType, setActiveEntityType] = useState(getInitialType);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Sync active entity type once options are loaded (only in create mode)
  useEffect(() => {
    if (isEdit) return;
    if (options?.allowed_entity_types && options.allowed_entity_types.length > 0) {
      if (!options.allowed_entity_types.includes(activeEntityType)) {
        setActiveEntityType(options.allowed_entity_types[0]);
      }
    }
  }, [options, activeEntityType, isEdit]);

  if (!isOpen) return null;

  const allowedEntityTypes = options?.allowed_entity_types || ['STANDARD_POST'];

  // Handle Form Submission (Create or Edit)
  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (isEdit && initialPost?.id) {
        const response = await updateCommunityPost(initialPost.id, payload, activeEntityType);
        setSubmitSuccess(true);
        onPostUpdated?.(response);

        // Auto close after short delay
        setTimeout(() => {
          onClose?.();
        }, 800);
      } else {
        const response = await createCommunityPost(payload);
        
        // Update local stats context optimistically
        adjustPosts?.(1);

        setSubmitSuccess(true);
        onPostCreated?.(response);

        // Auto redirect after short delay
        setTimeout(() => {
          if (isStandalonePage) {
            navigate('/community');
          } else {
            onClose?.();
          }
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
      const data = err?.response?.data;
      let errMsg = 'Failed to submit post. Please check the required fields.';
      if (data) {
        if (typeof data === 'string') {
          errMsg = data;
        } else if (data.error) {
          errMsg = data.error;
        } else {
          // Format validation errors into readable message
          const fieldErrors = Object.entries(data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          errMsg = fieldErrors || JSON.stringify(data);
        }
      } else if (err.message) {
        errMsg = err.message;
      }
      setSubmitError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Header info based on active post type and mode
  const headerMeta = {
    STANDARD_POST: {
      icon: FileText,
      iconBg: 'bg-blue-50 text-blue-600',
      title: isEdit ? 'Edit Community Post' : 'Create Community Post',
      description: isEdit ? 'Update your post details, knowledge, or media attachments' : 'Share knowledge, technical insights, or questions with campus peers',
    },
    INTERVIEW_EXPERIENCE: {
      icon: Award,
      iconBg: 'bg-amber-50 text-amber-600',
      title: isEdit ? 'Edit Interview Experience' : 'Share Interview Experience',
      description: isEdit ? 'Update your hiring round breakdowns, questions, and advice' : 'Break down your hiring rounds, questions asked, and preparation advice',
    },
    OPPORTUNITY: {
      icon: Briefcase,
      iconBg: 'bg-emerald-50 text-emerald-600',
      title: isEdit ? 'Edit Opportunity Drive' : 'Publish Placement / Internship Drive',
      description: isEdit ? 'Update job opening, requirements, or application deadline' : 'Broadcast campus recruitment, internships, or job openings to students',
    },
    ANNOUNCEMENT: {
      icon: Megaphone,
      iconBg: 'bg-purple-50 text-purple-600',
      title: isEdit ? 'Edit Campus Announcement' : 'Broadcast Campus Announcement',
      description: isEdit ? 'Update announcement notice, circular details, or target audience' : 'Publish official notices, placement drive schedules, or campus circulars',
    },
  }[activeEntityType] || {
    icon: FileText,
    iconBg: 'bg-blue-50 text-blue-600',
    title: isEdit ? 'Edit Post' : 'Create Community Post',
    description: isEdit ? 'Update post details' : 'Share knowledge, placement insights, or notices with campus peers',
  };
  const HeaderIcon = headerMeta.icon;

  // Card Content Wrapper
  const content = (
    <div className="space-y-5">
      {/* 1. Header with Title and Back to Feed / Close */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${headerMeta.iconBg} flex items-center justify-center font-bold shadow-2xs shrink-0`}>
            <HeaderIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {headerMeta.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {headerMeta.description}
            </p>
          </div>
        </div>

        {isStandalonePage ? (
          <button
            type="button"
            onClick={() => navigate('/community')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Feed</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {submitSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <h4 className="font-bold text-xs">{isEdit ? 'Updated Successfully!' : 'Published Successfully!'}</h4>
            <p className="text-2xs mt-0.5">
              {isEdit
                ? 'Your changes have been saved to the post.'
                : 'Your post is now live in the community feed. Redirecting...'}
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="py-8 text-center space-y-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading role permissions & form options...</p>
        </div>
      ) : (
        <>
          {/* 2. Compact Horizontal Entity Type Switcher (Only in create mode when multiple formats allowed) */}
          {!isEdit && allowedEntityTypes.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Post Format
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {allowedEntityTypes.includes('STANDARD_POST') && (
                  <button
                    type="button"
                    onClick={() => setActiveEntityType('STANDARD_POST')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                      activeEntityType === 'STANDARD_POST'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Standard Community Post</span>
                  </button>
                )}

                {allowedEntityTypes.includes('INTERVIEW_EXPERIENCE') && (
                  <button
                    type="button"
                    onClick={() => setActiveEntityType('INTERVIEW_EXPERIENCE')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                      activeEntityType === 'INTERVIEW_EXPERIENCE'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Detailed Interview Breakdown</span>
                  </button>
                )}

                {allowedEntityTypes.includes('OPPORTUNITY') && (
                  <button
                    type="button"
                    onClick={() => setActiveEntityType('OPPORTUNITY')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                      activeEntityType === 'OPPORTUNITY'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Placement / Internship Drive</span>
                  </button>
                )}

                {allowedEntityTypes.includes('ANNOUNCEMENT') && (
                  <button
                    type="button"
                    onClick={() => setActiveEntityType('ANNOUNCEMENT')}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                      activeEntityType === 'ANNOUNCEMENT'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Institutional Announcement</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. Sub-Form Rendering */}
          <div className="pt-1">
            {activeEntityType === 'STANDARD_POST' && (
              <StandardPostForm
                options={options}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                initialData={initialPost}
                mode={mode}
              />
            )}

            {activeEntityType === 'INTERVIEW_EXPERIENCE' && (
              <InterviewExperienceForm
                options={options}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                initialData={initialPost}
                mode={mode}
              />
            )}

            {activeEntityType === 'OPPORTUNITY' && (
              <OpportunityForm
                options={options}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                initialData={initialPost}
                mode={mode}
              />
            )}

            {activeEntityType === 'ANNOUNCEMENT' && (
              <AnnouncementForm
                options={options}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                submitError={submitError}
                initialData={initialPost}
                mode={mode}
              />
            )}
          </div>
        </>
      )}
    </div>
  );

  // Standalone page render
  if (isStandalonePage) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
        {content}
      </div>
    );
  }

  // Modal dialog render
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
        {content}
      </div>
    </div>
  );
}
