import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { roleLabel } from '../lib/format';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  /** Signs in and rejects accounts whose role doesn't match the login panel. */
  signIn: (email: string, password: string, role: UserRole) => Promise<string | null>;
  signUp: (params: SignUpParams) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string) {
  return supabase.from('profiles').select('*').eq('id', userId).maybeSingle<Profile>();
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // While signIn() checks the role, ignore auth events so the app doesn't
  // briefly flash into the wrong panel.
  const verifyingRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setIsLoading(false);
    });
    // Keep this callback synchronous: awaiting Supabase calls inside it can deadlock.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (verifyingRef.current) return;
      setSession(next);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  const loadProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const { data, error } = await fetchProfile(userId);
    if (error) {
      // e.g. offline — keep the session; the user lands on the welcome screen and can retry.
      console.warn('[Auth] Could not load profile', error.message);
      return;
    }
    if (!data) {
      console.warn('[Auth] Profile missing, signing out');
      setProfile(null);
      await supabase.auth.signOut();
      return;
    }
    setProfile(data);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setIsLoading(true);
    loadProfile().finally(() => setIsLoading(false));
  }, [userId, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string, role: UserRole) => {
      verifyingRef.current = true;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error || !data.session) return error?.message ?? 'Login failed.';

        const { data: p, error: profileError } = await fetchProfile(data.session.user.id);
        if (profileError || !p) {
          await supabase.auth.signOut();
          return 'Account profile not found. Has the database schema been set up?';
        }
        if (p.role !== role) {
          await supabase.auth.signOut();
          return `This account is registered as a ${roleLabel(p.role)}. Please use the ${roleLabel(p.role)} login.`;
        }
        setProfile(p);
        setSession(data.session);
        return null;
      } finally {
        verifyingRef.current = false;
      }
    },
    [],
  );

  const signUp = useCallback(async (params: SignUpParams) => {
    // The profile row is created by a database trigger from this metadata.
    const { data, error } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: {
          full_name: params.fullName.trim(),
          role: params.role,
          company_name: params.companyName?.trim() || null,
        },
      },
    });
    if (error) return { error: error.message, needsConfirmation: false };
    return { error: null, needsConfirmation: !data.session };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        role: profile?.role ?? null,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile: loadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
