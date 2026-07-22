import { useState, type FormEvent, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { Screen } from '@/components/common/layout/Screen';
import { ConfirmDialog } from '@/components/common/overlays/ConfirmDialog';
import { fieldClass, labelClass, secondaryButtonClass } from '@/styles/common/formStyles';
import { db } from '@/api/common/db';
import { supabase } from '@/api/common/supabaseClient';
import { pullAll } from '@/api/sync/syncEngine';
import { renameUser } from '@/services/auth/auth.actions';
import type { AppUser } from '@/types/auth/auth.types';
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

/**
 * Inline rename. Only display_name is editable anywhere in the app — the
 * username derives the login email, so changing it would lock the account out.
 */
function NameEditor({
  user,
  onDone,
}: {
  user: AppUser;
  onDone: () => void;
}) {
  const [value, setValue] = useState(user.display_name);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const err = await renameUser(user.id, value);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1">
      <label htmlFor={`name-${user.id}`} className="sr-only">
        Display name for @{user.username}
      </label>
      <input
        id={`name-${user.id}`}
        type="text"
        required
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={fieldClass}
      />

      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-[40px] flex-1 rounded-xl bg-accent-gradient px-4 text-sm font-semibold text-white active:opacity-70 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="min-h-[40px] flex-1 rounded-xl bg-surface-2 px-4 text-sm font-semibold text-muted active:opacity-70"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Pencil affordance shared by the profile card and each staff row. */
function EditNameButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 20h4l10-10-4-4L4 16v4z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
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

  const [renaming, setRenaming] = useState<string | null>(null);
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
              {renaming === u.id ? (
                <NameEditor user={u} onDone={() => setRenaming(null)} />
              ) : (
                <>
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
                  <EditNameButton
                    label={`Rename ${u.display_name}`}
                    onClick={() => setRenaming(u.id)}
                  />
                </>
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

        {!online && (
          <p className="rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
            You&apos;re offline — creating a staff account is the one change that cannot be
            queued, because the login itself is created on the server.
          </p>
        )}

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
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [editingOwnName, setEditingOwnName] = useState(false);

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

          {appUser && editingOwnName ? (
            <NameEditor user={appUser} onDone={() => setEditingOwnName(false)} />
          ) : (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-bold text-fg">{appUser?.display_name}</p>
                <p className="truncate text-sm text-muted">
                  @{appUser?.username} · {appUser?.role}
                </p>
              </div>
              {appUser && (
                <EditNameButton
                  label="Edit your display name"
                  onClick={() => setEditingOwnName(true)}
                />
              )}
            </>
          )}
        </section>

        {isSuperAdmin && (
          <>
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
          disabled={!online}
          onClick={() => setConfirmingSignOut(true)}
          className="mt-6 flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-danger-soft px-4 py-3 font-semibold text-danger active:opacity-70 disabled:opacity-40"
        >
          Sign out
        </button>

        {!online && (
          <p className="mt-2 text-center text-xs text-muted">
            Sign out needs a connection — it clears this device, and anything still queued
            would go with it.
          </p>
        )}

        {signOutError && (
          <p role="alert" className="mt-3 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {signOutError}
          </p>
        )}
      </Screen>

      {confirmingSignOut && (
        <ConfirmDialog
          title="Sign out?"
          message="Queued changes are pushed first, then cached data on this device is cleared. Anything the server rejects will be lost."
          confirmLabel="Sign out"
          onConfirm={() => {
            setConfirmingSignOut(false);
            void signOut().then(setSignOutError);
          }}
          onCancel={() => setConfirmingSignOut(false)}
        />
      )}
    </>
  );
}
