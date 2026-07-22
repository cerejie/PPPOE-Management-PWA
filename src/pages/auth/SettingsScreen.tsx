import { useState, type FormEvent, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/common/layout/Screen';
import { ConfirmDialog } from '@/components/common/overlays/ConfirmDialog';
import { fieldClass, labelClass, secondaryButtonClass } from '@/styles/common/formStyles';
import { db } from '@/api/common/db';
import { supabase } from '@/api/common/supabaseClient';
import { pullAll } from '@/api/sync/syncEngine';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import { useAuth } from '@/store/auth/AuthContext';

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4 rounded-3xl bg-surface p-5 shadow-card">
      <h2 className="mb-4 text-base font-bold tracking-tight text-fg">{title}</h2>
      {children}
    </section>
  );
}

/** Row that links out to one of the management tabs. */
function ManageLink({ to, label, hint }: { to: string; label: string; hint: string }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex min-h-[60px] w-full items-center justify-between gap-3 border-b border-line/60 py-3 text-left last:border-b-0 active:opacity-60"
    >
      <div className="min-w-0">
        <p className="font-semibold text-fg">{label}</p>
        <p className="truncate text-xs text-muted">{hint}</p>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0 text-muted"
        aria-hidden
      >
        <path
          d="M9 5l7 7-7 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Staff accounts
// ---------------------------------------------------------------------------

function StaffSection() {
  const online = useOnline();
  const staff = useLiveQuery(async () => {
    const users = await db.app_users.toArray();
    return users.sort((a, b) => a.display_name.localeCompare(b.display_name));
  }, []);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setSuccess(null);
    setBusy(true);

    const { data, error: fnErr } = await supabase.functions.invoke('create-staff', {
      body: {
        username: username.trim().toLowerCase(),
        display_name: displayName.trim(),
        password,
      },
    });

    setBusy(false);

    if (fnErr) {
      setError(fnErr.message);
      return;
    }
    const result = data as { ok?: boolean; error?: string } | null;
    if (!result?.ok) {
      setError(result?.error ?? 'Failed to create staff account.');
      return;
    }

    setSuccess(`Staff account "${username.trim().toLowerCase()}" created.`);
    setUsername('');
    setDisplayName('');
    setPassword('');
    await pullAll();
  }

  return (
    <SectionCard title="Staff accounts">
      {(staff ?? []).length > 0 && (
        <ul className="mb-5">
          {(staff ?? []).map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between gap-3 border-b border-line/60 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-fg">{u.display_name}</p>
                <p className="truncate text-xs text-muted">
                  @{u.username} · {u.role}
                </p>
              </div>
              {!u.is_active && (
                <span className="shrink-0 rounded-full bg-danger-soft px-2.5 py-1 text-[11px] font-semibold text-danger">
                  inactive
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleCreate} className="space-y-3">
        <div>
          <label htmlFor="staff-username" className={labelClass}>
            Username
          </label>
          <input
            id="staff-username"
            type="text"
            placeholder="lowercase, no spaces"
            required
            autoCapitalize="none"
            autoCorrect="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="staff-name" className={labelClass}>
            Display name
          </label>
          <input
            id="staff-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="staff-password" className={labelClass}>
            Password
          </label>
          <input
            id="staff-password"
            type="password"
            placeholder="min 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        {success && (
          <p className="rounded-2xl bg-ok-soft px-4 py-3 text-sm text-ok">{success}</p>
        )}

        <button type="submit" disabled={busy || !online} className={secondaryButtonClass}>
          {busy ? 'Creating…' : 'Create staff account'}
        </button>
      </form>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const { appUser, signOut, isSuperAdmin } = useAuth();
  const online = useOnline();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const initials = (appUser?.display_name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <Screen title="Settings">
        <section className="flex items-center gap-4 rounded-4xl bg-surface p-5 shadow-card">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-gradient text-lg font-bold text-white"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-fg">{appUser?.display_name}</p>
            <p className="truncate text-sm text-muted">
              @{appUser?.username} · {appUser?.role}
            </p>
          </div>
        </section>

        {isSuperAdmin && (
          <>
            {!online && (
              <p className="mt-4 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
                Settings changes need a connection.
              </p>
            )}

            <SectionCard title="Manage">
              <ManageLink to="/rooms" label="Rooms" hint="Add, rename or remove rooms & routers" />
              <ManageLink to="/plans" label="Plans" hint="Price, speed and validity" />
              <ManageLink to="/clients" label="Clients" hint="Add or edit client accounts" />
            </SectionCard>

            <StaffSection />
          </>
        )}

        <button
          type="button"
          onClick={() => setConfirmingSignOut(true)}
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-danger-soft px-4 py-3 font-semibold text-danger active:opacity-70"
        >
          Sign out
        </button>
      </Screen>

      {confirmingSignOut && (
        <ConfirmDialog
          title="Sign out?"
          message="Cached data on this device is cleared. Anything still waiting to sync will be lost, so sync first if you're unsure."
          confirmLabel="Sign out"
          onConfirm={() => void signOut()}
          onCancel={() => setConfirmingSignOut(false)}
        />
      )}
    </>
  );
}
