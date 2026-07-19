import { useState, type FormEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/components/Screen';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { pullAll } from '@/lib/sync';
import { usePlans, useRooms, useRouters } from '@/features/clients/hooks';
import { useOnline } from '@/features/sync/useSyncStatus';
import { useAuth } from './AuthContext';

const inputClass =
  'block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30';

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{title}</h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Plans
// ---------------------------------------------------------------------------

function PlansSection() {
  const plans = usePlans();
  const online = useOnline();
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.from('plans').insert({
      name: name.trim(),
      price: Number(price),
      duration_days: Number(days),
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setName('');
    setPrice('');
    setDays('30');
    await pullAll();
  }

  return (
    <SectionCard title="Plans">
      {(plans ?? []).length > 0 && (
        <ul className="mb-4 divide-y divide-slate-100">
          {(plans ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2.5">
              <span className="font-medium text-slate-900">{p.name}</span>
              <span className="text-sm text-muted">
                {formatMoney(p.price)} / {p.duration_days}d
              </span>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="space-y-2">
        <input
          type="text"
          placeholder="Plan name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Price"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
          <input
            type="number"
            placeholder="Days"
            inputMode="numeric"
            min="1"
            required
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !online}
          className="min-h-[44px] w-full rounded-xl bg-accent-soft px-4 py-2.5 font-semibold text-accent-text active:opacity-70 disabled:opacity-50"
        >
          Add plan
        </button>
      </form>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Rooms & routers
// ---------------------------------------------------------------------------

function RoomsSection() {
  const rooms = useRooms();
  const routers = useRouters();
  const online = useOnline();
  const [roomName, setRoomName] = useState('');
  const [routerLabel, setRouterLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    const { data: room, error: roomErr } = await supabase
      .from('rooms')
      .insert({ name: roomName.trim() })
      .select('id')
      .single();

    if (roomErr || !room) {
      setBusy(false);
      setError(roomErr?.message ?? 'Failed to create room');
      return;
    }

    if (routerLabel.trim()) {
      const { error: routerErr } = await supabase
        .from('routers')
        .insert({ room_id: room.id, label: routerLabel.trim() });
      if (routerErr) {
        setBusy(false);
        setError(`Room created, but router failed: ${routerErr.message}`);
        await pullAll();
        return;
      }
    }

    setBusy(false);
    setRoomName('');
    setRouterLabel('');
    await pullAll();
  }

  return (
    <SectionCard title="Rooms & routers">
      {(rooms ?? []).length > 0 && (
        <ul className="mb-4 divide-y divide-slate-100">
          {(rooms ?? []).map((r) => {
            const router = routers?.find((rt) => rt.room_id === r.id);
            return (
              <li key={r.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-slate-900">{r.name}</span>
                <span className="text-sm text-muted">{router?.label ?? 'no router'}</span>
              </li>
            );
          })}
        </ul>
      )}
      <form onSubmit={handleAdd} className="space-y-2">
        <input
          type="text"
          placeholder="Room name"
          required
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Router label (optional)"
          value={routerLabel}
          onChange={(e) => setRouterLabel(e.target.value)}
          className={inputClass}
        />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy || !online}
          className="min-h-[44px] w-full rounded-xl bg-accent-soft px-4 py-2.5 font-semibold text-accent-text active:opacity-70 disabled:opacity-50"
        >
          Add room
        </button>
      </form>
    </SectionCard>
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
        <ul className="mb-4 divide-y divide-slate-100">
          {(staff ?? []).map((u) => (
            <li key={u.id} className="flex items-center justify-between py-2.5">
              <div>
                <p className="font-medium text-slate-900">{u.display_name}</p>
                <p className="text-xs text-muted">@{u.username} · {u.role}</p>
              </div>
              {!u.is_active && (
                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-danger">
                  inactive
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleCreate} className="space-y-2">
        <input
          type="text"
          placeholder="Username (lowercase)"
          required
          autoCapitalize="none"
          autoCorrect="off"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="Display name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-ok">{success}</p>}
        <button
          type="submit"
          disabled={busy || !online}
          className="min-h-[44px] w-full rounded-xl bg-accent-soft px-4 py-2.5 font-semibold text-accent-text active:opacity-70 disabled:opacity-50"
        >
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

  return (
    <Screen title="Settings">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="font-semibold text-slate-900">{appUser?.display_name}</p>
        <p className="text-sm text-muted">@{appUser?.username} · {appUser?.role}</p>
      </div>

      {isSuperAdmin && !online && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-warn">
          Settings changes need a connection.
        </p>
      )}

      {isSuperAdmin && (
        <>
          <PlansSection />
          <RoomsSection />
          <StaffSection />
        </>
      )}

      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 min-h-[48px] w-full rounded-xl bg-red-50 px-4 py-3 font-semibold text-danger active:opacity-70"
      >
        Sign out
      </button>
    </Screen>
  );
}
