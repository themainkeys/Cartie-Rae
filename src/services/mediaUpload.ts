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
  // Time + random suffix avoids collisions without needing a DB.
  const rand = Math.random().toString(36).slice(2, 8);
  return `${Date.now()}-${rand}-${base}.${ext}`;
}

/**
 * Uploads a File (image OR video) to the media bucket under `folder/` and returns
 * its public URL. `blob` argument lets callers upload a processed/compressed Blob
 * while keeping the original file's name/type for the storage path.
 */
export async function uploadMedia(file: File, folder = 'uploads', blob?: Blob): Promise<UploadResult> {
  if (!isMediaUploadEnabled) {
    return { error: 'Media storage is not configured (Supabase credentials missing).' };
  }

  const path = `${folder}/${safeName(file)}`;
  const body = blob ?? file;

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
