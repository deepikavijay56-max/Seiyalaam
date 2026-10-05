import { createClient } from '@supabase/supabase-js';

// Verified production Supabase instance for Seiyalaam
const DEFAULT_SUPABASE_URL = 'https://tntylkoroyvygzwdiewq.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_BdYZnMfeuWwC4PZBjAN5AQ_PFkvmKCk';

function resolveSupabaseConfig() {
  const envUrl = (
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const envKey = (
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim();

  // If env var is provided and is NOT a placeholder or localhost, use it; otherwise use verified default
  const isEnvUrlValid = Boolean(
    envUrl &&
    !envUrl.includes('your-project-ref') &&
    envUrl !== 'http://localhost:54321' &&
    envUrl.startsWith('https://')
  );

  const isEnvKeyValid = Boolean(
    envKey &&
    !envKey.includes('placeholder') &&
    envKey !== 'your-public-anon-key-here' &&
    envKey !== 'public-anon-key'
  );

  const supabaseUrl = isEnvUrlValid ? envUrl : DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = isEnvKeyValid ? envKey : DEFAULT_SUPABASE_ANON_KEY;

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('https://') &&
    supabaseUrl.includes('.supabase.co') &&
    !supabaseUrl.includes('your-project-ref')
  );
}

// Supabase client configured with real credentials and session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

