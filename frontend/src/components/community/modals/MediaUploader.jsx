import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Trash2, Link as LinkIcon, Check, Loader2, AlertCircle } from 'lucide-react';
import { uploadCommunityMedia } from '../../../services/community/communityService';

/**
 * MediaUploader
 * Drag & drop and real file uploader for community posts.
 * Uploads device images directly to Django backend (/media/posts/).
 * "Quick presets" removed per user requirements.
 */
export default function MediaUploader({ mediaFiles = [], onChange }) {
  const [urlInput, setUrlInput] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const fileInputRef = useRef(null);

  const handleAddMedia = (fileUrl, mediaType = 'IMAGE', relativePath = null) => {
    if (!fileUrl || !fileUrl.trim()) return;
    const trimmed = fileUrl.trim();
    if (trimmed.length > 500) {
      setUploadError('Media URL exceeds 500 characters limit. Please use a shorter URL.');
      return;
    }
    const updated = [
      ...mediaFiles,
      {
        media_type: mediaType,
        file: relativePath || trimmed,
        url: trimmed,
      },
    ];
    onChange?.(updated);
    setUrlInput('');
    setShowUrlModal(false);
    setUploadError(null);
  };

  const handleRemoveMedia = (index) => {
    const updated = mediaFiles.filter((_, i) => i !== index);
    onChange?.(updated);
  };

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      for (const file of Array.from(files)) {
        if (mediaFiles.length >= 4) {
          setUploadError('Maximum 4 attachments allowed per post.');
          break;
        }

        if (file.size > 10 * 1024 * 1024) {
          setUploadError(`File "${file.name}" exceeds 10MB limit.`);
          continue;
        }

        const res = await uploadCommunityMedia(file);
        if (res?.url) {
          handleAddMedia(res.url, 'IMAGE', res.file);
        }
      }
    } catch (err) {
      console.error('Failed to upload media:', err);
      const msg = err?.response?.data?.error || err.message || 'Image upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Attachments & Media ({mediaFiles.length})</span>
        </label>
        <span className="text-xs text-slate-400 font-normal">Optional · Max 4 attachments</span>
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Media Thumbnails Grid */}
      {(mediaFiles.length > 0 || isUploading) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {mediaFiles.map((media, idx) => (
            <div
              key={idx}
              className="group relative rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center shadow-2xs"
            >
              <img
                src={media.url || media.file}
                alt={`Attachment ${idx + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = `<span class="text-2xs text-slate-500 font-mono">Attachment #${idx + 1}</span>`;
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveMedia(idx)}
                className="absolute top-1 right-1 p-1 rounded-md bg-slate-900/70 hover:bg-red-600 text-white transition-colors opacity-90 group-hover:opacity-100 cursor-pointer"
                title="Remove attachment"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {/* Uploading Placeholder Tile */}
          {isUploading && (
            <div className="rounded-lg border border-dashed border-blue-400 aspect-video bg-blue-50/50 flex flex-col items-center justify-center gap-1 text-blue-600 shadow-2xs animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-3xs font-medium">Uploading...</span>
            </div>
          )}
        </div>
      )}

      {/* Upload & Add Bar */}
      {mediaFiles.length < 4 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* File Input trigger */}
            <label
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-xs font-medium text-slate-700 cursor-pointer transition-colors ${
                isUploading ? 'opacity-60 pointer-events-none' : ''
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span>{isUploading ? 'Uploading Image...' : 'Choose Device Image'}</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                disabled={isUploading}
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {/* URL Input Button */}
            <button
              type="button"
              onClick={() => setShowUrlModal(!showUrlModal)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Add Image URL</span>
            </button>
          </div>

          {/* Direct URL Popover */}
          {showUrlModal && (
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 flex items-center gap-2 mt-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="flex-1 px-3 py-1 text-xs rounded-md border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 bg-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMedia(urlInput);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => handleAddMedia(urlInput)}
                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
