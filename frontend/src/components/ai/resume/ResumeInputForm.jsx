import React, { useState, useEffect, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Sparkles, 
  Loader2, 
  Bookmark,
  Check
} from 'lucide-react';
import aiService from '../../../services/ai/aiService';

/**
 * ResumeInputForm Component
 * Handles dual-mode resume submission:
 * 1. Primary profile resume (auto-detected via /api/ai/resume/primary/)
 * 2. New PDF/DOCX file upload with client validation
 * Plus multiline Job Description input with character counter (min 50 chars).
 */
export default function ResumeInputForm({ onAnalyze, isAnalyzing }) {
  const [usePrimary, setUsePrimary] = useState(false);
  const [primaryResume, setPrimaryResume] = useState(null);
  const [isCheckingPrimary, setIsCheckingPrimary] = useState(true);

  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [saveToProfile, setSaveToProfile] = useState(false);

  const [jobDescription, setJobDescription] = useState('');
  const fileInputRef = useRef(null);

  // Check primary resume on mount
  useEffect(() => {
    let isMounted = true;
    const checkPrimary = async () => {
      try {
        const res = await aiService.getPrimaryResume();
        if (isMounted && res?.has_primary_resume && res?.resume) {
          setPrimaryResume(res.resume);
          setUsePrimary(true); // Default to primary if exists
        }
      } catch (err) {
        // Silently allow file upload mode
      } finally {
        if (isMounted) setIsCheckingPrimary(false);
      }
    };
    checkPrimary();
    return () => { isMounted = false; };
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    setFileError(null);
    if (!file) return;

    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const fileNameLower = file.name.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => fileNameLower.endsWith(ext));

    if (!isAllowed) {
      setFileError('Invalid file type. Please upload a PDF or DOCX file.');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    setUploadedFile(file);
    setUsePrimary(false);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation
  const hasResume = usePrimary ? !!primaryResume : !!uploadedFile;
  const isJdValid = jobDescription.trim().length >= 20;
  const canSubmit = hasResume && isJdValid && !isAnalyzing;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (usePrimary) {
      onAnalyze({
        use_primary: true,
        use_primary_resume: true,
        job_description: jobDescription.trim(),
        save_to_profile: false,
      });
    } else {
      const formData = new FormData();
      formData.append('resume_file', uploadedFile);
      formData.append('job_description', jobDescription.trim());
      formData.append('save_to_profile', saveToProfile ? 'true' : 'false');
      formData.append('use_primary', 'false');
      formData.append('use_primary_resume', 'false');
      onAnalyze(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>Resume & Target Role Details</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Provide your resume and target job description to evaluate ATS compatibility and receive actionable resume rewrites
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Resume Selector / Upload */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Resume Source
          </label>

          {/* Toggle buttons if primary resume is available */}
          {primaryResume && (
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setUsePrimary(true)}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                  usePrimary
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Use Primary Resume
              </button>
              <button
                type="button"
                onClick={() => setUsePrimary(false)}
                className={`flex-1 py-1.5 px-3 rounded-lg transition-all ${
                  !usePrimary
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload Different File
              </button>
            </div>
          )}

          {/* Mode A: Primary Profile Resume Card */}
          {usePrimary && primaryResume ? (
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {primaryResume.filename || 'Primary_Resume.pdf'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                      Primary
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Uploaded from your student profile
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUsePrimary(false)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline shrink-0 ml-2"
              >
                Replace
              </button>
            </div>
          ) : (
            /* Mode B: File Upload Dropzone */
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleFileChange}
                className="hidden"
                id="resume-file-input"
              />

              {!uploadedFile ? (
                <label
                  htmlFor="resume-file-input"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition-colors mb-2">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-blue-600">
                    Click to upload or drag & drop
                  </span>
                  <span className="text-2xs text-slate-400 mt-1">
                    PDF or DOCX (Max size: 5MB)
                  </span>
                </label>
              ) : (
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {uploadedFile.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {fileError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{fileError}</span>
                </div>
              )}

              {/* Option to save newly uploaded file as profile resume */}
              {uploadedFile && (
                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs text-slate-600">
                    Save this resume as my primary profile resume
                  </span>
                </label>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Job Description Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="job-description-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              2. Target Job Description (JD)
            </label>
            <span
              className={`text-2xs font-semibold ${
                jobDescription.trim().length >= 20
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              {jobDescription.trim().length} / 20 min chars
            </span>
          </div>

          <textarea
            id="job-description-input"
            rows={5}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste target job description, responsibilities, or desired qualifications here..."
            className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 resize-none font-normal"
          />

          <p className="text-[11px] text-slate-400">
            Tip: Include required skills and responsibilities for highest matching precision.
          </p>
        </div>
      </div>

      {/* SUBMIT BUTTON ROW */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs text-slate-500">
          {!hasResume ? (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Please select or upload a resume.
            </span>
          ) : !isJdValid ? (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Job description needs at least 20 characters.
            </span>
          ) : (
            <span className="text-emerald-600 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Ready for ATS evaluation.
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Resume...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyze Resume & Calculate ATS Score</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
