import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// True when real (non-placeholder) Supabase credentials are present. This alone
// enables Storage uploads (media) — see `isMediaUploadEnabled` below.
export const hasSupabaseCredentials =
  supabaseUrl !== '' &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'eyJhbGciOi...';

// FULL BACKEND MODE (Supabase Auth for admin login + DB for contacts) is opt-in.
// It requires the `admin_users` / `contact_requests` tables AND staff accounts to
// exist; otherwise the admin can't log in. So merely having credentials (which we
// want for Storage uploads) must NOT flip the whole app into auth mode and lock
// out the demo console. Enable it explicitly with VITE_SUPABASE_BACKEND="true".
export const isSupabaseConfigured =
  hasSupabaseCredentials && (import.meta.env.VITE_SUPABASE_BACKEND || '').trim() === 'true';

// Media uploads (Supabase Storage) work whenever credentials exist, independently
// of the auth mode above.
export const isMediaUploadEnabled = hasSupabaseCredentials;

if (!hasSupabaseCredentials && import.meta.env.DEV) {
  console.warn(
    '⚠️ Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. ' +
    'Running in demo mode: media uploads fall back to local storage and admin login uses the demo role picker.'
  );
}

// Instantiate the client. Uses harmless placeholders when unconfigured so imports
// never crash at startup.
export const supabase = createClient(
  hasSupabaseCredentials ? supabaseUrl : 'https://placeholder-project.supabase.co',
  hasSupabaseCredentials ? supabaseAnonKey : 'placeholder-anon-key'
);
