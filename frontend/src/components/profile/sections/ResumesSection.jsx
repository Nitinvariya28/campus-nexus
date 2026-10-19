import React from 'react';
import { UploadCloud, FileText, Download, Trash2, CheckCircle2 } from 'lucide-react';

/**
 * ResumesSection Component
 * Document management tab: Drag-and-drop uploader (Max 5MB) and interactive resumes data table.
 */
export default function ResumesSection({ resumes, onUpload, onDelete, onSetPrimary }) {
  const sampleResumes = resumes && resumes.length > 0 ? resumes : [
    {
      id: 1,
      title: 'Full Stack Engineer Resume - Fall 2026',
      file_type: 'PDF',
      file_size: '1.2 MB',
      created_at: '10 Apr 2026',
      is_primary: true,
    },
    {
      id: 2,
      title: 'Backend Developer Resume',
      file_type: 'PDF',
      file_size: '880 KB',
      created_at: '15 Jan 2026',
      is_primary: false,
    },
    {
      id: 3,
      title: 'Resume 2025',
      file_type: 'PDF',
      file_size: '1.1 MB',
      created_at: '22 Nov 2025',
      is_primary: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Upload New Resume Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-600" /> Upload New Resume
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Dropzone */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-blue-400 bg-slate-50/50 transition cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Drag & drop your PDF or DOCX file here
            </p>
            <p className="text-2xs text-slate-400 mt-1 mb-3">
              Maximum file size: 5 MB (strictly enforced)
            </p>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              Choose File
            </button>
          </div>

          {/* Right Metadata Form */}
          <div className="space-y-3.5 flex flex-col justify-center">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Resume Title
              </label>
              <input
                type="text"
                placeholder="e.g. Full Stack Engineer Resume - Fall 2026"
                className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Set as primary resume for campus applications
              </span>
            </label>

            <button
              type="button"
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 transition"
            >
              Upload Resume
            </button>
          </div>
        </div>
      </div>

      {/* Your Resumes Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Your Resumes
          </h2>
          <span className="text-xs text-slate-500">
            {sampleResumes.length} Document{sampleResumes.length !== 1 ? 's' : ''}
          </span>
        </div>

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
              {sampleResumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate max-w-xs">{resume.title}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 uppercase font-mono text-2xs">
                    {resume.file_type || 'PDF'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                    {resume.created_at || '10 Apr 2026'}
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
                    <button
                      type="button"
                      className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                      title="Download resume"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
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
      </div>
    </div>
  );
}
