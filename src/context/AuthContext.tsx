import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, AuthContextValue } from '../types';
import { AuthContext } from './authContextDef';

export type { Profile, AuthContextValue };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error: supaError } = await supabase
        .from('profiles')
        .select('id, display_name, area, language, role')
        .eq('id', userId)
        .maybeSingle();

      if (!supaError && data) {
        setProfile(data as Profile);
      } else if (!data) {
        // Fallback: If trigger was delayed or row is missing, safely ensure profile row exists
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData?.user;
        if (currentUser && currentUser.id === userId) {
          const fallbackName = currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'Maker';
          const newProf: Profile = {
            id: userId,
            display_name: fallbackName,
            area: currentUser.user_metadata?.area || null,
            language: (currentUser.user_metadata?.language as 'en' | 'ta') || 'en',
            role: 'user',
          };
          try {
            await supabase.from('profiles').upsert(newProf);
          } catch {
            // Profile may be managed by database trigger
          }
          setProfile(newProf);
        }
      }
    } catch (err) {
      console.warn('[Seiyalaam Auth] fetchProfile note:', err);
    }
  }, []);

  // Load session on startup
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!isMounted) return;
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          fetchProfile(currentSession.user.id);
        } else {
          setUser(null);
          setSession(null);
          setProfile(null);
        }
      })
      .catch((err) => {
        console.warn('[Seiyalaam Auth] Session load warning:', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        fetchProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT' || !newSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  async function signUp(email: string, password: string, displayName: string): Promise<boolean> {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase configuration is missing or invalid. Please check your environment variables.');
        return false;
      }

      const sanitizedName = displayName.trim() || email.split('@')[0] || 'Maker';
      const cleanEmail = email.trim().toLowerCase();

      const { data, error: supaError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            display_name: sanitizedName,
            language: 'en',
          },
        },
      });

      if (supaError) {
        throw supaError;
      }

      // Check for duplicate account where Supabase returned user with empty identities (email enumeration protection)
      if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        setError('This email is already registered. Try signing in instead.');
        return false;
      }

      if (data?.user) {
        setUser(data.user);
        setSession(data.session);

        const newProf: Profile = {
          id: data.user.id,
          display_name: sanitizedName,
          area: null,
          language: 'en',
          role: 'user',
        };
        setProfile(newProf);

        if (data.session) {
          await fetchProfile(data.user.id);
        }
        return true;
      }
      return false;
    } catch (e: unknown) {
      console.error('[Seiyalaam Auth] Signup technical error:', e);
      const rawMsg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : 'Sign up failed');
      const lower = rawMsg.toLowerCase();
      const status = typeof e === 'object' && e !== null && 'status' in e ? (e as { status: unknown }).status : null;

      let userFriendlyMsg = rawMsg;

      if (
        lower.includes('user already registered') ||
        lower.includes('already registered') ||
        lower.includes('already exists') ||
        status === 422
      ) {
        userFriendlyMsg = 'This email is already registered. Try signing in instead.';
      } else if (
        lower.includes('database error') ||
        lower.includes('saving new user') ||
        status === 500
      ) {
        userFriendlyMsg = "We couldn't finish creating your account. Please try again.";
      } else if (
        lower.includes('password') && (lower.includes('least') || lower.includes('short') || lower.includes('weak'))
      ) {
        userFriendlyMsg = 'Password must be at least 8 characters long.';
      } else if (
        lower.includes('rate limit') ||
        lower.includes('over_email_send_rate_limit')
      ) {
        userFriendlyMsg = 'Too many attempts. Please wait a few moments and try again.';
      } else if (
        e instanceof TypeError ||
        lower.includes('failed to fetch') ||
        lower.includes('networkerror') ||
        lower.includes('network error')
      ) {
        userFriendlyMsg = 'Unable to connect right now. Please check your connection and try again.';
      }

      setError(userFriendlyMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string): Promise<boolean> {
    setError(null);
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase configuration is missing or invalid. Please check your environment variables.');
        return false;
      }

      const cleanEmail = email.trim().toLowerCase();
      const { data, error: supaError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (supaError) {
        throw supaError;
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await fetchProfile(data.user.id);
        return true;
      }
      return false;
    } catch (e: unknown) {
      console.error('[Seiyalaam Auth] Signin technical error:', e);
      const rawMsg = e instanceof Error ? e.message : (typeof e === 'object' && e !== null && 'message' in e ? String((e as { message: unknown }).message) : 'Sign in failed');
      const lower = rawMsg.toLowerCase();

      let userFriendlyMsg = rawMsg;

      if (
        lower.includes('invalid login credentials') ||
        lower.includes('invalid_grant') ||
        lower.includes('wrong password') ||
        lower.includes('user not found')
      ) {
        userFriendlyMsg = 'Invalid email or password. Please check your details and try again.';
      } else if (lower.includes('email not confirmed')) {
        userFriendlyMsg = 'Please verify your email address before signing in.';
      } else if (
        e instanceof TypeError ||
        lower.includes('failed to fetch') ||
        lower.includes('networkerror') ||
        lower.includes('network error')
      ) {
        userFriendlyMsg = 'Unable to connect right now. Please check your connection and try again.';
      }

      setError(userFriendlyMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    setUser(null);
    setSession(null);
    setProfile(null);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Seiyalaam Auth] Signout warning:', err);
    }
  }

  async function resetPassword(email: string) {
    setError(null);
    try {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (supaError) setError(supaError.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Password reset failed');
    }
  }

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading, error,
      signUp, signIn, signOut, resetPassword, clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

