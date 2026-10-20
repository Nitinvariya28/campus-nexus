import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Download, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * ResumesSection Component
 * Document management tab: Real file upload (Max 5MB) and database-backed resumes data table.
 * Strictly zero dummy data.
 */
export default function ResumesSection({
  resumes = [],
  isUploading = false,
  onUpload,
  onDelete,
  onSetPrimary,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeTitle, setResumeTitle] = useState('');
  const [isPrimaryChecked, setIsPrimaryChecked] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate File Extension
    const validExts = ['.pdf', '.docx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!validExts.includes(fileExt)) {
      toast.error('Only PDF and DOCX files are allowed.');
      return;
    }

    // Validate File Size (Max 5MB enforced by backend)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error('File size exceeds the 5 MB limit.');
      return;
    }

    setSelectedFile(file);
    if (!resumeTitle.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setResumeTitle(cleanName);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF or DOCX file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', resumeTitle.trim() || selectedFile.name);
    formData.append('is_primary', isPrimaryChecked ? 'true' : 'false');

    if (onUpload) {
      const success = await onUpload(formData);
      if (success) {
        setSelectedFile(null);
        setResumeTitle('');
        setIsPrimaryChecked(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recent';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload New Resume Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-600" /> Upload New Resume
        </h2>

        <form onSubmit={handleUploadSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition cursor-pointer ${
              selectedFile
                ? 'border-blue-500 bg-blue-50/30'
                : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-2xs text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change file
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  Drag & drop your PDF or DOCX file here
                </p>
                <p className="text-2xs text-slate-400 mt-1 mb-3">
                  Maximum file size: 5 MB (strictly enforced)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                >
                  Choose File
                </button>
              </>
            )}
          </div>

          {/* Right Metadata Form */}
          <div className="space-y-3.5 flex flex-col justify-center">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Resume Title
              </label>
              <input
                type="text"
                value={resumeTitle}
                onChange={(e) => setResumeTitle(e.target.value)}
                placeholder="e.g. Full Stack Engineer Resume - Fall 2026"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrimaryChecked}
                onChange={(e) => setIsPrimaryChecked(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Set as primary resume for campus placement applications
              </span>
            </label>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition"
            >
              {isUploading ? 'Uploading to Server...' : 'Upload Resume'}
            </button>
          </div>
        </form>
      </div>

      {/* Your Resumes Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Your Resumes
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {resumes.length} Document{resumes.length !== 1 ? 's' : ''}
          </span>
        </div>

        {resumes && resumes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Uploaded On</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resumes.map((resume) => (
                  <tr key={resume.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs">{resume.title}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 uppercase font-mono text-2xs">
                      {resume.file_type || 'PDF'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatDate(resume.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      {resume.is_primary ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Primary
                        </span>
                      ) : (
                        <span className="text-slate-400 text-2xs">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      {!resume.is_primary && (
                        <button
                          type="button"
                          onClick={() => onSetPrimary && onSetPrimary(resume.id)}
                          className="px-2.5 py-1 rounded-md text-2xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                        >
                          Set Primary
                        </button>
                      )}
                      {resume.file_url && (
                        <a
                          href={resume.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-block p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Download resume"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete && onDelete(resume.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-600 font-medium">No resumes uploaded yet.</p>
            <p className="text-2xs text-slate-400">
              Upload your primary placement resume using the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
