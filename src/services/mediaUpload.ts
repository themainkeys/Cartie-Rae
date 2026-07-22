/**
 * Media upload helper — uploads photos & videos to the Supabase Storage `media`
 * bucket and returns a public URL that persists (unlike base64/blob previews).
 *
 * Requires the `media` bucket + access policies (see supabase/storage_media_setup.sql).
 * Falls back gracefully via `isMediaUploadEnabled` when Supabase is not configured.
 */

import { supabase, isMediaUploadEnabled } from './supabaseClient';

const MEDIA_BUCKET = 'media';

export type UploadResult = { url: string } | { error: string };

function safeName(file: File): string {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const base =
    file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) ||
    'file';
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${rand}-${base}.${ext}`;
}

/**
 * Uploads a File (image OR video) to the media bucket under `folder/` and returns
 * its public URL. Optional `onProgress` callback receives 0-100 percentage updates.
 * `blob` argument lets callers upload a processed/compressed Blob while keeping
 * the original file's name/type for the storage path.
 */
export async function uploadMedia(
  file: File,
  folder = 'uploads',
  onProgress?: (percent: number) => void,
  blob?: Blob
): Promise<UploadResult> {
  if (!isMediaUploadEnabled) {
    return { error: 'Media storage is not configured (Supabase credentials missing).' };
  }

  const path = `${folder}/${safeName(file)}`;
  const body = blob ?? file;

  // Use XMLHttpRequest for upload progress tracking
  if (onProgress) {
    return new Promise((resolve) => {
      // Get the Supabase storage URL + anon key from the client
      const storageUrl = `${(supabase as any).storageUrl}/object/${MEDIA_BUCKET}/${path}`;
      const anonKey = (supabase as any).headers?.['apikey'] ?? '';

      const xhr = new XMLHttpRequest();
      xhr.open('POST', storageUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${anonKey}`);
      xhr.setRequestHeader('apikey', anonKey);
      xhr.setRequestHeader('x-upsert', 'false');
      if (file.type) xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('Cache-Control', '3600');

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
          onProgress(100);
          resolve({ url: data.publicUrl });
        } else {
          let msg = 'Upload failed.';
          try { msg = JSON.parse(xhr.responseText)?.message ?? msg; } catch { /* ignore */ }
          resolve({ error: msg });
        }
      };

      xhr.onerror = () => resolve({ error: 'Network error during upload.' });
      xhr.send(body);
    });
  }

  // Fallback: use Supabase SDK (no progress)
  try {
    const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });

    if (error) {
      return { error: error.message };
    }

    const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown upload error.' };
  }
}
