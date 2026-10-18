import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Award,
  Trophy,
  Lightbulb,
  Building2,
  MessageSquare,
  Tag as TagIcon,
  Plus,
  Check,
  X,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import MediaUploader from '../MediaUploader';
import CompanyCombobox from '../../common/CompanyCombobox';

const POST_TYPE_ICONS = {
  INTERNSHIP: Briefcase,
  INTERVIEW_EXPERIENCE: Award,
  PLACEMENT_EXPERIENCE: Trophy,
  CAREER_ADVICE: Lightbulb,
  COMPANY_INFO: Building2,
  GENERAL: MessageSquare,
};

/**
 * StandardPostForm
 * Role-adaptive form for Student and Alumni community posts.
 * Sleek, professional UI with compact category pills, combobox autocomplete,
 * and standard typography matching the university design system.
 */
export default function StandardPostForm({
  options,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const postTypes = useMemo(() => options?.post_types || [
    { value: 'INTERNSHIP', label: 'Internship' },
    { value: 'INTERVIEW_EXPERIENCE', label: 'Interview Experience' },
    { value: 'COMPANY_INFO', label: 'Company Info' },
    { value: 'GENERAL', label: 'General' },
  ], [options?.post_types]);

  const companies = useMemo(() => options?.companies || [], [options?.companies]);
  const tags = useMemo(() => options?.tags || [], [options?.tags]);

  // Form State
  const [selectedPostType, setSelectedPostType] = useState(postTypes[0]?.value || 'GENERAL');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [formValidationErrors, setFormValidationErrors] = useState({});

  // Tag selection toggler
  const handleToggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  // Add custom tag chip
  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim().replace(/^#/, '');
    if (trimmed && !customTags.includes(trimmed)) {
      setCustomTags([...customTags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleRemoveCustomTag = (tag) => {
    setCustomTags(customTags.filter((t) => t !== tag));
  };

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    }

    if (!content.trim()) {
      errors.content = 'Content is required.';
    } else if (content.trim().length < 10) {
      errors.content = 'Content must be at least 10 characters.';
    }

    if (Object.keys(errors).length > 0) {
      setFormValidationErrors(errors);
      return;
    }

    setFormValidationErrors({});

    const payload = {
      entity_type: 'STANDARD_POST',
      title: title.trim(),
      content: content.trim(),
      post_type: selectedPostType,
      tag_ids: selectedTagIds,
      new_tags: customTags,
      media_files: mediaFiles,
    };

    if (newCompanyName.trim()) {
      payload.new_company_name = newCompanyName.trim();
    } else if (companyId) {
      payload.company_id = parseInt(companyId);
    }

    onSubmit?.(payload);
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }}
      className="space-y-5"
    >
      {/* Server or Global Error Banner */}
      {submitError && (
        <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{typeof submitError === 'string' ? submitError : 'Failed to publish post. Please verify all fields.'}</span>
        </div>
      )}

      {/* SECTION 1: Compact Horizontal Category Pills */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Post Category <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {postTypes.map((type) => {
            const Icon = POST_TYPE_ICONS[type.value] || MessageSquare;
            const isSelected = selectedPostType === type.value;

            return (
              <button
                key={type.value}
                type="button"
                onClick={() => setSelectedPostType(type.value)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{type.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Post Headline / Title */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            Headline / Title <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-400 font-mono">{title.length} / 250</span>
        </div>
        <textarea
          rows={2}
          maxLength={250}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Cleared Google STEP Internship 2026: Roadmap & Preparation Advice"
          className={`w-full text-sm rounded-lg border p-3 focus:outline-hidden focus:ring-2 bg-white transition-all resize-none shadow-2xs leading-snug ${
            formValidationErrors.title
              ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
              : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
          }`}
        />
        {formValidationErrors.title && (
          <p className="text-2xs text-red-600 font-medium">{formValidationErrors.title}</p>
        )}
      </div>

      {/* SECTION 3: Associated Company via Combobox */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700">
          Associated Company <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <CompanyCombobox
          companies={companies}
          selectedCompanyId={companyId}
          newCompanyName={newCompanyName}
          onChange={({ companyId: cId, newCompanyName: nName }) => {
            setCompanyId(cId || '');
            setNewCompanyName(nName || '');
          }}
          placeholder="Search verified companies or type custom name..."
        />
      </div>

      {/* SECTION 4: Compact Hashtags & Topic Tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <TagIcon className="w-3.5 h-3.5 text-slate-400" />
            <span>Topic Hashtags</span>
          </label>
          <span className="text-xs text-slate-400 font-normal">Select or create tags</span>
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.slice(0, 12).map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 border-blue-400 font-semibold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>#{tag.name}</span>
                {isSelected ? (
                  <Check className="w-3 h-3 text-blue-600 stroke-[2.5]" />
                ) : (
                  <Plus className="w-2.5 h-2.5 text-slate-400" />
                )}
              </button>
            );
          })}

          {/* Render selected custom tags */}
          {customTags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveCustomTag(tag)}
                className="text-emerald-500 hover:text-emerald-800"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add Custom Tag Bar */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            placeholder="Type custom hashtag (e.g. SystemDesign, DSA)..."
            className="flex-1 text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomTag();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddCustomTag}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* SECTION 5: Post Body / Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700">
            Post Content & Details <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-slate-400 font-mono">{content.length} characters</span>
        </div>
        <textarea
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your detailed experience, interview preparation advice, questions asked, or general guidance..."
          className={`w-full text-sm rounded-lg border p-3 focus:outline-hidden focus:ring-2 bg-white transition-all leading-relaxed shadow-2xs ${
            formValidationErrors.content
              ? 'border-red-400 focus:ring-red-200 focus:border-red-500'
              : 'border-slate-300 focus:ring-blue-500/20 focus:border-blue-600'
          }`}
        />
        {formValidationErrors.content && (
          <p className="text-2xs text-red-600 font-medium">{formValidationErrors.content}</p>
        )}
      </div>

      {/* SECTION 6: Media Attachments */}
      <div className="pt-2 border-t border-slate-100">
        <MediaUploader mediaFiles={mediaFiles} onChange={setMediaFiles} />
      </div>

      {/* SECTION 7: Submit CTA Bar */}
      <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-slate-500">
          Published to university students and alumni feed.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Publish Post</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
