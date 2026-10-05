import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
) as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Seiyalaam] Neither VITE_SUPABASE_* nor NEXT_PUBLIC_SUPABASE_* environment variables are set. ' +
    'Please configure your Supabase variables in Vercel or in .env.local.'
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'http://localhost:54321' &&
    !supabaseUrl.includes('your-project-ref')
  );
}

// NOTE: Only the public anon key is used here. The service_role key is NEVER in client code.
export const supabase = createClient(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'public-anon-key'
);
