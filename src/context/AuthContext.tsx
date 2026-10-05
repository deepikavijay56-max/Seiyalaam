import { useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, AuthContextValue } from '../types';
import { AuthContext } from './authContextDef';

export type { Profile, AuthContextValue };

const LOCAL_AUTH_KEY = 'seiyalaam_auth_user';

function getLocalStoredUser(): { user: User; profile: Profile } | null {
  try {
    const raw = localStorage.getItem(LOCAL_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Lazy state initialization to avoid synchronous setState inside mount effect
  const [user, setUser] = useState<User | null>(() => getLocalStoredUser()?.user ?? null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => getLocalStoredUser()?.profile ?? null);
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
        const prof = data as Profile;
        setProfile(prof);
        const stored = getLocalStoredUser();
        if (stored?.user) {
          localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: stored.user, profile: prof }));
        }
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
            language: 'en',
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

  // Load session on mount
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
          setProfile(null);
          localStorage.removeItem(LOCAL_AUTH_KEY);
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
        localStorage.removeItem(LOCAL_AUTH_KEY);
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
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: data.user, profile: newProf }));

        // Ensure profile row exists in database if authenticated session is present
        if (data.session) {
          try {
            await supabase.from('profiles').upsert(newProf);
          } catch {
            // Handled by database trigger
          }
        }
        return true;
      }
      return false;
    } catch (e: unknown) {
      console.error('[Seiyalaam Auth] Signup technical error:', e);
      const rawMsg = e instanceof Error ? e.message : 'Sign up failed';
      let userFriendlyMsg = rawMsg;

      // Transform technical PostgreSQL / Supabase errors into helpful user-facing text
      if (rawMsg.includes('Database error saving new user') || rawMsg.includes('database error')) {
        userFriendlyMsg = "We couldn't create your account right now. Please try again.";
      } else if (rawMsg.includes('User already registered') || rawMsg.includes('already registered') || rawMsg.includes('already exists')) {
        userFriendlyMsg = 'This email is already registered. Try signing in instead.';
      } else if (rawMsg.includes('Password should be at least') || rawMsg.includes('weak password')) {
        userFriendlyMsg = 'Password must be at least 8 characters long.';
      } else if (rawMsg.includes('invalid') && rawMsg.includes('email')) {
        userFriendlyMsg = 'Please check your details and try again.';
      } else if (rawMsg.includes('rate limit') || rawMsg.includes('over_email_send_rate_limit')) {
        userFriendlyMsg = 'Email confirmation rate limit reached. Please disable "Confirm email" in Supabase Dashboard (Auth -> Providers -> Email) or wait a few minutes.';
      } else if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError') || rawMsg.includes('fetch')) {
        userFriendlyMsg = 'Network connection failed. Please check your internet connection.';
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
      const rawMsg = e instanceof Error ? e.message : 'Sign in failed';
      let userFriendlyMsg = rawMsg;

      if (rawMsg.includes('Invalid login credentials') || rawMsg.includes('invalid_grant')) {
        userFriendlyMsg = 'Invalid email or password. Please check your details and try again.';
      } else if (rawMsg.includes('Email not confirmed')) {
        userFriendlyMsg = 'Account created. Please check your email to verify your account.';
      } else if (rawMsg.includes('Failed to fetch') || rawMsg.includes('NetworkError')) {
        userFriendlyMsg = 'Network connection failed. Please check your internet connection.';
      }

      setError(userFriendlyMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setError(null);
    localStorage.removeItem(LOCAL_AUTH_KEY);
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
