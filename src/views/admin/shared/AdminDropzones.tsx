/**
 * admin/shared/AdminDropzones.tsx
 *
 * Image and video upload dropzone components used by multiple admin managers.
 * Extracted verbatim from AdminPortal.tsx (lines 134–450) and re-exported
 * so the large admin sections can import them independently.
 */

import React, { useState, useRef } from 'react';
import { Camera, Video } from 'lucide-react';
import { isMediaUploadEnabled } from '../../../services/supabaseClient';
import { uploadMedia } from '../../../services/mediaUpload';
import { compressImage } from './adminUtils';

// ── ImageDropzone ─────────────────────────────────────────────────────────────

export interface ImageDropzoneProps {
  imageValue: string;
  onImageChange: (image: string) => void;
  label: string;
  prefersReducedMotion?: boolean;
}

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  imageValue,
  onImageChange,
  label,
  prefersReducedMotion = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Suppress unused warning — prop kept for future animation gating
  void prefersReducedMotion;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    let compressedDataUrl = '';
    try {
      compressedDataUrl = await compressImage(file);
    } catch (error) {
      console.error('Failed to compress image:', error);
    }

    if (!isMediaUploadEnabled) {
      if (compressedDataUrl) {
        onImageChange(compressedDataUrl);
      } else {
        const reader = new FileReader();
        reader.onloadend = () => onImageChange(reader.result as string);
        reader.readAsDataURL(file);
      }
      return;
    }

    setIsUploading(true);
    try {
      let uploadFile: File = file;
      if (compressedDataUrl) {
        const blob = await (await fetch(compressedDataUrl)).blob();
        uploadFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
      }
      const result = await uploadMedia(uploadFile, 'images');
      if ('url' in result) {
        onImageChange(result.url);
      } else {
        setUploadError(result.error);
        if (compressedDataUrl) onImageChange(compressedDataUrl);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      if (compressedDataUrl) onImageChange(compressedDataUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] ${
        isDragActive
          ? 'border-brand-rose bg-brand-pink-light/35 scale-[1.01]'
          : 'border-brand-warm-tan/30 bg-[#FAF6F0] hover:border-brand-rose/40 hover:bg-[#FAF6F0]/85'
      }`}
    >
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {isUploading ? (
        <div className="flex items-center gap-2 text-brand-chocolate">
          <div className="w-4 h-4 border-2 border-brand-rose border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] font-bold">Uploading {label}…</span>
        </div>
      ) : imageValue ? (
        <div className="flex items-center gap-3 w-full">
          <img src={imageValue} alt="Uploaded Preview" className="w-12 h-12 object-cover rounded-lg border border-brand-warm-tan/20 shadow-xs" />
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-chocolate truncate">{label} Uploaded</p>
            <p className="text-[9px] text-[#A67E6B] font-medium">Click anywhere to replace file</p>
            {uploadError && <p className="text-[9px] text-red-600 font-medium truncate">Saved locally (upload failed: {uploadError})</p>}
          </div>
          <span className="text-[9px] text-brand-rose font-bold bg-brand-pink-light/50 px-2 py-1 rounded hover:bg-brand-rose hover:text-white transition-colors whitespace-nowrap">Replace</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Camera className="w-5 h-5 text-brand-rose mb-1" />
          <span className="text-[10px] font-bold text-brand-chocolate">{label} Graphic</span>
          <span className="text-[9px] text-[#8C6D62] mt-0.5">Drag &amp; drop here or click to browse</span>
          {uploadError && <span className="text-[9px] text-red-600 font-medium mt-1">Upload failed: {uploadError}</span>}
        </div>
      )}
    </div>
  );
};

// ── VideoDropzone ─────────────────────────────────────────────────────────────

export interface VideoDropzoneProps {
  videoValue: string;
  onVideoChange: (videoUrl: string, file?: File) => void;
  label: string;
  prefersReducedMotion?: boolean;
}

export const VideoDropzone: React.FC<VideoDropzoneProps> = ({
  videoValue,
  onVideoChange,
  label,
  prefersReducedMotion = false,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  void prefersReducedMotion;

  const processFile = async (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4/WebM).');
      return;
    }
    const MAX_MB = 500;
    const MAX_BYTES = MAX_MB * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      setUploadError(`File is ${sizeMB} MB — max allowed is ${MAX_MB} MB. Use a YouTube or TikTok URL for very large videos.`);
      return;
    }
    setUploadError(null);

    if (!isMediaUploadEnabled) {
      onVideoChange(URL.createObjectURL(file), file);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadMedia(file, 'videos', (pct) => setUploadProgress(pct));
      if ('url' in result) {
        setUploadProgress(100);
        onVideoChange(result.url, file);
      } else {
        let friendlyError = result.error;
        if (result.error.includes('exceeded the maximum allowed')) {
          friendlyError = `File too large — go to Supabase → Storage → Settings and raise the file size limit.`;
        } else if (result.error.includes('row-level security') || result.error.includes('policy')) {
          friendlyError = `Permission denied — run the storage RLS fix SQL in Supabase.`;
        }
        setUploadError(friendlyError);
        onVideoChange(URL.createObjectURL(file), file);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed.');
      onVideoChange(URL.createObjectURL(file), file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 min-h-[90px] ${
        isDragActive
          ? 'border-brand-rose bg-brand-pink-light/35 scale-[1.01]'
          : 'border-brand-warm-tan/30 bg-[#FAF6F0] hover:border-brand-rose/40 hover:bg-[#FAF6F0]/85'
      }`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input ref={fileInputRef} type="file" accept="video/mp4,video/webm" onChange={handleChange} className="hidden" />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2 w-full px-2">
          <div className="flex items-center gap-2 text-brand-chocolate">
            <div className="w-4 h-4 border-2 border-brand-rose border-t-transparent rounded-full animate-spin shrink-0" />
            <span className="text-[10px] font-bold">Uploading {label}… {uploadProgress > 0 ? `${uploadProgress}%` : ''}</span>
          </div>
          <div className="w-full bg-brand-warm-tan/20 rounded-full h-1.5 overflow-hidden">
            <div className="bg-brand-rose h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      ) : videoValue && (videoValue.startsWith('blob:') || /\.(mp4|webm)(\?|$)/i.test(videoValue) || videoValue.includes('/storage/v1/object/public/media/')) ? (
        <div className="flex items-center gap-3 w-full">
          <div className="w-12 h-12 rounded-lg border border-brand-warm-tan/20 bg-black flex items-center justify-center overflow-hidden shrink-0">
            <video src={videoValue} className="w-full h-full object-cover" muted playsInline />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-chocolate truncate">{label} Loaded</p>
            <p className="text-[9px] text-[#A67E6B] font-medium">Click anywhere to replace file</p>
            {uploadError
              ? <p className="text-[9px] text-red-600 font-medium leading-tight mt-0.5">⚠ {uploadError}</p>
              : videoValue.startsWith('blob:') && <p className="text-[9px] text-amber-600 font-medium">Temporary — configure storage to persist</p>}
          </div>
          <span className="text-[9px] text-brand-rose font-bold bg-brand-pink-light/50 px-2 py-1 rounded hover:bg-brand-rose hover:text-white transition-colors whitespace-nowrap">Replace</span>
        </div>
      ) : videoValue ? (
        <div className="flex items-center gap-3 w-full">
          <div className="w-12 h-12 rounded-lg border border-brand-warm-tan/20 bg-black flex items-center justify-center overflow-hidden shrink-0">
            {videoValue.includes('youtube.com') || videoValue.includes('youtu.be') || videoValue.includes('tiktok.com')
              ? <Video className="w-5 h-5 text-brand-rose" />
              : <video src={videoValue} className="w-full h-full object-cover" muted playsInline />}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-[10px] font-bold text-brand-chocolate truncate">Linked Video URL active</p>
            <p className="text-[9px] text-[#8C6D62] truncate">Click anywhere to upload file</p>
          </div>
          <span className="text-[9px] text-brand-rose font-bold bg-brand-pink-light/50 px-2 py-1 rounded hover:bg-brand-rose hover:text-white transition-colors whitespace-nowrap">Upload file</span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <Video className="w-5 h-5 text-brand-rose mb-1" />
          <span className="text-[10px] font-bold text-brand-chocolate">{label}</span>
          <span className="text-[9px] text-[#8C6D62] mt-0.5">Drag &amp; drop MP4/WebM here or click to browse</span>
        </div>
      )}
    </div>
  );
};
