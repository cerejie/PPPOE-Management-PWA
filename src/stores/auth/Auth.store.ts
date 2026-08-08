import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Session } from '@supabase/supabase-js';
import { supabase, usernameToEmail } from '@/api/common/supabaseClient';
import { clearLocalCache, db, deleteMeta, getMeta, setMeta } from '@/api/common/db';
import { flushOutbox, pullAll, startSyncEngine } from '@/api/sync/syncEngine';
import type { AppUser } from '@/types/auth/Auth.types';

/** Last user this device signed in as — the offline half of `session`. */
const AUTH_USER_KEY = 'auth_user_id';

interface AuthState {
  session: Session | null;
  userId: string | null;
  appUser: AppUser | null;
  /** True until the initial session restore finishes. */
  loading: boolean;
  /** Set once, so StrictMode's double-mount cannot subscribe twice. */
  initialized: boolean;
}

interface AuthActions {
  /** Restore the session and subscribe to auth changes. Safe to call twice. */
  initialize: () => void;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  /** Returns an error message when the sign-out could not be completed. */
  signOut: () => Promise<string | null>;
}

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

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  session: null,
  userId: null,
  appUser: null,
  loading: true,
  initialized: false,

  initialize: () => {
    if (get().initialized) return;
    set({ initialized: true });

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        set({ session: data.session });

        // Offline, `getSession()` returns null because the access token expired
        // and the refresh could not reach the auth server — not because the user
        // signed out. The refresh token stays on disk and re-validates on
        // reconnect, so fall back to the last user this device signed in as and
        // let the app run against Dexie. Supabase only clears that token when
        // the server actually rejects it, which arrives as SIGNED_OUT below.
        const restored = data.session?.user.id ?? (await getMeta(AUTH_USER_KEY));
        if (!restored) return;

        const user = await loadAppUser(restored);

        // Same bar as signIn(): a deactivated account does not get back in, even
        // when the only copy of that flag is the last mirror we pulled.
        if (user && !user.is_active) {
          await deleteMeta(AUTH_USER_KEY);
          set({ session: null });
          if (navigator.onLine) await supabase.auth.signOut();
          return;
        }

        if (user) {
          set({ userId: user.id, appUser: user });
          await setMeta(AUTH_USER_KEY, user.id);
        }
      } finally {
        // Whatever failed above, the splash screen must not be the end state.
        set({ loading: false });
      }
    })();

    supabase.auth.onAuthStateChange((event, next) => {
      set({ session: next });
      // A null session on any other event is a failed refresh, which offline is
      // expected; only an explicit SIGNED_OUT means the token is really gone.
      if (event === 'SIGNED_OUT') {
        set({ userId: null, appUser: null });
        void deleteMeta(AUTH_USER_KEY);
      }
    });

    // The mirror is the source of truth for the profile, so a rename — or a
    // pull that changes this user's role — reaches every screen without a
    // reload, exactly as the previous useLiveQuery did.
    db.app_users.hook('updating', (_mods, primaryKey, updated) => {
      if (primaryKey === get().userId) {
        set({ appUser: { ...updated } as AppUser });
      }
    });
    db.app_users.hook('creating', (primaryKey, obj) => {
      if (primaryKey === get().userId) set({ appUser: obj });
    });
  },

  signIn: async (identifier, password) => {
    if (!navigator.onLine) {
      return 'Signing in needs a connection. Once signed in, this device keeps working offline.';
    }

    // Real email => SuperAdmin login; bare username => synthetic staff email.
    const email = identifier.includes('@') ? identifier.trim() : usernameToEmail(identifier);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    if (!data.user) return 'Login failed.';

    const user = await loadAppUser(data.user.id);
    if (!user || !user.is_active) {
      await supabase.auth.signOut();
      return 'This account is inactive.';
    }
    set({ userId: user.id, appUser: user });
    await setMeta(AUTH_USER_KEY, user.id);
    void pullAll();
    return null;
  },

  signOut: async () => {
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
    set({ userId: null, appUser: null, session: null });
    return null;
  },
}));

/**
 * True while the app may be used. Deliberately not "has a valid token": a
 * device that signed in and then went offline stays authenticated here, and only
 * a server-confirmed sign-out takes it back to false.
 */
const selectAuthenticated = (s: AuthState): boolean => Boolean(s.session) || s.userId !== null;

// Signed in — with or without a live token — so the sync engine runs and the
// outbox flushes the moment connectivity returns. Offline both calls no-op.
// Subscribing outside React keeps this out of any component's render path.
let syncStarted = false;
useAuthStore.subscribe((state) => {
  if (syncStarted || !selectAuthenticated(state)) return;
  syncStarted = true;
  startSyncEngine();
  void flushOutbox().then(() => pullAll());
});

interface AuthSnapshot {
  appUser: AppUser | null;
  authenticated: boolean;
  loading: boolean;
  isSuperAdmin: boolean;
  signIn: AuthActions['signIn'];
  signOut: AuthActions['signOut'];
}

export function useAuth(): AuthSnapshot {
  return useAuthStore(
    useShallow((s) => ({
      appUser: s.appUser,
      authenticated: selectAuthenticated(s),
      loading: s.loading,
      isSuperAdmin: s.appUser?.role === 'superadmin',
      signIn: s.signIn,
      signOut: s.signOut,
    })),
  );
}
