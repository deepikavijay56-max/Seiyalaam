import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  display_name: string;
  area: string | null;
  language: 'en' | 'ta';
  role: 'user' | 'admin';
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    let isMounted = true;

    // First check local stored session for instant offline response
    const cached = getLocalStoredUser();
    if (cached) {
      setUser(cached.user);
      setProfile(cached.profile);
    }

    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!isMounted) return;
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          fetchProfile(currentSession.user.id);
        }
      })
      .catch((err) => {
        console.warn('Supabase session fetch skipped (offline mode):', err?.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!isMounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        fetchProfile(newSession.user.id);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error: supaError } = await supabase
        .from('profiles')
        .select('id, display_name, area, language, role')
        .eq('id', userId)
        .single();

      if (!supaError && data) {
        setProfile(data as Profile);
      }
    } catch {
      // ignore offline errors
    }
  }

  async function signUp(email: string, password: string, displayName: string) {
    setError(null);
    setLoading(true);
    try {
      const { data, error: supaError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
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
          display_name: displayName || email.split('@')[0],
          area: null,
          language: 'en',
          role: 'user',
        };
        setProfile(newProf);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: data.user, profile: newProf }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign up failed';
      // Graceful offline fallback: If Supabase backend is offline or unreachable
      if (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('NetworkError')) {
        console.warn('Supabase server is offline. Creating local session for maker development.');
        const mockUser = {
          id: `usr-${Date.now()}`,
          email,
          aud: 'authenticated',
          role: 'authenticated',
          app_metadata: {},
          user_metadata: { display_name: displayName },
          created_at: new Date().toISOString(),
        } as unknown as User;

        const newProf: Profile = {
          id: mockUser.id,
          display_name: displayName || email.split('@')[0],
          area: null,
          language: 'en',
          role: 'user',
        };

        setUser(mockUser);
        setProfile(newProf);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: mockUser, profile: newProf }));
        setError(null);
        return;
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setError(null);
    setLoading(true);
    try {
      const { data, error: supaError } = await supabase.auth.signInWithPassword({ email, password });
      if (supaError) throw supaError;

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        fetchProfile(data.user.id);
        const newProf: Profile = {
          id: data.user.id,
          display_name: data.user.user_metadata?.display_name || email.split('@')[0],
          area: null,
          language: 'en',
          role: 'user',
        };
        setProfile(newProf);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: data.user, profile: newProf }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign in failed';
      // Graceful offline fallback for local development
      if (msg.includes('Failed to fetch') || msg.includes('fetch') || msg.includes('NetworkError')) {
        console.warn('Supabase server is offline. Authenticating via local session.');
        const cached = getLocalStoredUser();
        const mockUser = (cached?.user && cached.user.email === email)
          ? cached.user
          : ({
              id: `usr-${Date.now()}`,
              email,
              aud: 'authenticated',
              role: 'authenticated',
              app_metadata: {},
              user_metadata: { display_name: email.split('@')[0] },
              created_at: new Date().toISOString(),
            } as unknown as User);

        const newProf: Profile = cached?.profile ?? {
          id: mockUser.id,
          display_name: email.split('@')[0],
          area: null,
          language: 'en',
          role: 'user',
        };

        setUser(mockUser);
        setProfile(newProf);
        localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify({ user: mockUser, profile: newProf }));
        setError(null);
        return;
      }

      setError(msg);
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
    } catch {
      // ignore network errors on signout
    }
  }

  async function resetPassword(email: string) {
    setError(null);
    try {
      const { error: supaError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (supaError) setError(supaError.message);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Password reset failed');
    }
  }

  function clearError() {
    setError(null);
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

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
