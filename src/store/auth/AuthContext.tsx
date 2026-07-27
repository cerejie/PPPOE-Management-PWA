import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { Session } from '@supabase/supabase-js';
import { supabase, usernameToEmail } from '@/api/common/supabaseClient';
import { clearLocalCache, db, deleteMeta, getMeta, setMeta } from '@/api/common/db';
import { flushOutbox, pullAll, startSyncEngine } from '@/api/sync/syncEngine';
import type { AppUser } from '@/types/auth/auth.types';

/** Last user this device signed in as — the offline half of `session`. */
const AUTH_USER_KEY = 'auth_user_id';

interface AuthContextValue {
  appUser: AppUser | null;
  /**
   * True while the app may be used. Deliberately not "has a valid token": a
   * device that signed in and then went offline stays authenticated here, and
   * only a server-confirmed sign-out takes it back to false.
   */
  authenticated: boolean;
  /** True until the initial session restore finishes. */
  loading: boolean;
  isSuperAdmin: boolean;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  /** Returns an error message when the sign-out could not be completed. */
  signOut: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadAppUser(userId: string): Promise<AppUser | null> {
  // Prefer the local mirror so offline restarts still resolve the role.
  const cached = await db.app_users.get(userId);
  if (cached) return cached;

  // Offline the fetch below can only hang the splash screen — there is nothing
  // to fall back to, so fail fast and let the caller send them to sign in.
  if (!navigator.onLine) return null;

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
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Read live from Dexie rather than held as state, so a rename — or a pull
  // that changes this user's role — reaches every screen without a reload.
  const appUser = useLiveQuery(
    async () => (userId ? ((await db.app_users.get(userId)) ?? null) : null),
    [userId],
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function restore(): Promise<void> {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session);

        // Offline, `getSession()` returns null because the access token expired
        // and the refresh could not reach the auth server — not because the user
        // signed out. The refresh token stays on disk and re-validates on
        // reconnect, so fall back to the last user this device signed in as and
        // let the app run against Dexie. Supabase only clears that token when the
        // server actually rejects it, which arrives here as SIGNED_OUT below.
        const restored = data.session?.user.id ?? (await getMeta(AUTH_USER_KEY));
        if (cancelled) return;

        if (!restored) return;

        const user = await loadAppUser(restored);
        if (cancelled) return;

        // Same bar as signIn(): a deactivated account does not get back in,
        // even when the only copy of that flag is the last mirror we pulled.
        if (user && !user.is_active) {
          await deleteMeta(AUTH_USER_KEY);
          setSession(null);
          if (navigator.onLine) await supabase.auth.signOut();
          return;
        }

        if (user) {
          setUserId(user.id);
          await setMeta(AUTH_USER_KEY, user.id);
        }
      } finally {
        // Whatever failed above, the splash screen must not be the end state.
        if (!cancelled) setLoading(false);
      }
    }

    void restore();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // A null session on any other event is a failed refresh, which offline is
      // expected; only an explicit SIGNED_OUT means the token is really gone.
      if (event === 'SIGNED_OUT') {
        setUserId(null);
        void deleteMeta(AUTH_USER_KEY);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Signed in — with or without a live token — so the sync engine runs and the
  // outbox flushes the moment connectivity returns. Offline both calls no-op.
  const authenticated = Boolean(session) || userId !== null;

  useEffect(() => {
    if (!authenticated) return;
    startSyncEngine();
    void flushOutbox().then(() => pullAll());
  }, [authenticated]);

  const signIn = useCallback(
    async (identifier: string, password: string): Promise<string | null> => {
      if (!navigator.onLine) {
        return 'Signing in needs a connection. Once signed in, this device keeps working offline.';
      }

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
      setUserId(user.id);
      await setMeta(AUTH_USER_KEY, user.id);
      void pullAll();
      return null;
    },
    [],
  );

  const signOut = useCallback(async (): Promise<string | null> => {
    // Signing out wipes the local cache, and the outbox with it. Offline that
    // would discard queued writes with no way to push them first, and Supabase
    // cannot revoke the token anyway — so it has to wait for a connection.
    if (!navigator.onLine) {
      return 'Sign out needs a connection so queued changes are not lost.';
    }

    // Last chance to push anything still queued before the cache is cleared.
    await flushOutbox();

    const { error } = await supabase.auth.signOut();
    if (error) return error.message;

    await clearLocalCache();
    setUserId(null);
    setSession(null);
    return null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      appUser,
      authenticated,
      loading,
      isSuperAdmin: appUser?.role === 'superadmin',
      signIn,
      signOut,
    }),
    [appUser, authenticated, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
