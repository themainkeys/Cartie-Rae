import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// Determine if Supabase has been configured with real, non-placeholder environment keys
export const isSupabaseConfigured = 
  supabaseUrl !== '' && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'eyJhbGciOi...';

if (!isSupabaseConfigured) {
  if (import.meta.env.DEV) {
    console.warn(
      '⚠️ Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing or set to placeholders. ' +
      'Application will fallback to client-side localStorage/demo mode.'
    );
  }
}

// Instantiate client. Uses dummy placeholders if not configured to prevent crashes on startup.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key'
);
