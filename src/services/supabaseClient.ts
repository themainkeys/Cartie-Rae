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

// FULL BACKEND MODE = real Supabase Auth admin login + DB persistence.
// Default: ON whenever real credentials are present (so setting VITE_SUPABASE_URL +
// VITE_SUPABASE_ANON_KEY is all that's needed — matching the login screen's own
// instructions). This requires the `admin_users` / `contact_requests` tables and at
// least one admin account to exist (see supabase/auth_full_setup.sql).
// Escape hatch: set VITE_SUPABASE_BACKEND="false" to force the passwordless demo
// console even when credentials are configured (e.g. for a public preview build).
export const isSupabaseConfigured =
  hasSupabaseCredentials && (import.meta.env.VITE_SUPABASE_BACKEND || '').trim().toLowerCase() !== 'false';

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
