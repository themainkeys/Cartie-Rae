/**
 * admin/shared/adminUtils.ts
 *
 * Shared pure utilities for the Admin Portal sub-modules.
 * These are intentionally dependency-free (no React, no context) so every
 * manager can import them without coupling.
 */

import { uploadMedia } from '../../../services/mediaUpload';
import { isMediaUploadEnabled } from '../../../services/supabaseClient';

// ── Video source resolver ─────────────────────────────────────────────────────

export const resolveVideoSource = (url: string) => {
  const cleanUrl = url.trim();

  // 1. Raw TikTok video ID (18-20 digits)
  if (/^\d{18,20}$/.test(cleanUrl)) {
    return {
      type: 'tiktok' as const,
      id: cleanUrl,
      url: `https://www.tiktok.com/embed/v2/${cleanUrl}`,
    };
  }

  // 2. YouTube
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    let videoId = '';
    if (cleanUrl.includes('/embed/')) {
      videoId = cleanUrl.split('/embed/')[1]?.split('?')[0] || '';
    } else if (cleanUrl.includes('/shorts/')) {
      videoId = cleanUrl.split('/shorts/')[1]?.split('?')[0] || '';
    } else if (cleanUrl.includes('watch?v=')) {
      videoId = cleanUrl.split('watch?v=')[1]?.split('&')[0] || '';
    } else if (cleanUrl.includes('youtu.be/')) {
      videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0] || '';
    }
    return {
      type: 'youtube' as const,
      id: videoId,
      url: videoId ? `https://www.youtube.com/embed/${videoId}` : cleanUrl,
    };
  }

  // 3. TikTok
  if (cleanUrl.includes('tiktok.com')) {
    let videoId = '';
    const idMatch =
      cleanUrl.match(/\/video\/(\d+)/) ||
      cleanUrl.match(/\/embed\/v2\/(\d+)/) ||
      cleanUrl.match(/\/embed\/(\d+)/) ||
      cleanUrl.match(/(\d{18,20})/);
    if (idMatch) videoId = idMatch[1] || idMatch[0];
    return {
      type: 'tiktok' as const,
      id: videoId,
      url: videoId ? `https://www.tiktok.com/embed/v2/${videoId}` : cleanUrl,
    };
  }

  // 4. Direct video URL
  return { type: 'direct' as const, id: '', url: cleanUrl };
};

// ── Supabase Storage upload helper ───────────────────────────────────────────

/** Upload a file to Supabase Storage and return its public URL, or null on failure. */
export const uploadToStorage = async (
  file: File,
  folder: 'thumbnails' | 'videos' | 'gallery'
): Promise<string | null> => {
  if (!isMediaUploadEnabled) return null;
  const result = await uploadMedia(file, folder);
  if ('error' in result) {
    console.error('[Storage] upload error:', result.error);
    return null;
  }
  return result.url;
};

// ── Image compressor ──────────────────────────────────────────────────────────

export const compressImage = (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.75
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        } else {
          if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(event.target?.result as string); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
