import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Seiyalaam] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. ' +
    'Copy .env.example to .env.local and fill in your Supabase credentials.'
  );
}

// NOTE: Only the anon key is used here. The service_role key is NEVER in client code.
export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'public-anon-key'
);
