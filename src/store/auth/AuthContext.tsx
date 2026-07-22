import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, usernameToEmail } from '@/api/common/supabaseClient';
import { clearLocalCache, db } from '@/api/common/db';
import { flushOutbox, pullAll, startSyncEngine } from '@/api/sync/syncEngine';
import type { AppUser } from '@/types/auth/auth.types';

interface AuthContextValue {
  session: Session | null;
  appUser: AppUser | null;
  /** True until the initial session restore finishes. */
  loading: boolean;
  isSuperAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadAppUser(userId: string): Promise<AppUser | null> {
  // Prefer the local mirror so offline restarts still resolve the role.
  const cached = await db.app_users.get(userId);
  if (cached) return cached;

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  const user = data as AppUser;
  await db.app_users.put(user);
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      if (data.session) {
        const user = await loadAppUser(data.session.user.id);
        if (!cancelled) setAppUser(user);
      }
      if (!cancelled) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setAppUser(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Start sync + initial pull once authenticated.
  useEffect(() => {
    if (!session) return;
    startSyncEngine();
    void flushOutbox().then(() => pullAll());
  }, [session]);

  const signIn = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      // Real email => SuperAdmin login; bare username => synthetic staff email.
      const email = identifier.includes('@')
        ? identifier.trim()
        : usernameToEmail(identifier);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return error.message;
      if (!data.user) return 'Login failed.';

      const user = await loadAppUser(data.user.id);
      if (!user || !user.is_active) {
        await supabase.auth.signOut();
        return 'This account is inactive.';
      }
      setAppUser(user);
      void pullAll();
      return null;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    await clearLocalCache();
    setAppUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      appUser,
      loading,
      isSuperAdmin: appUser?.role === 'superadmin',
      signIn,
      signOut,
    }),
    [session, appUser, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
