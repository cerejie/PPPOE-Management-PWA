import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { useOnline } from '@/features/sync/useSyncStatus';
import type { AccountStatus } from '@/lib/types';
import { createClient, softDeleteClient, updateClient, type ClientInput } from './actions';
import { useClient, usePlans, useRooms, useRouters } from './hooks';

const inputClass =
  'mt-1 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30';

const ACCOUNT_STATUSES: AccountStatus[] = ['active', 'suspended', 'terminated'];

/** SuperAdmin-only create/edit form. Online-only by design. */
export function ClientFormScreen() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const navigate = useNavigate();
  const online = useOnline();

  const existing = useClient(id);
  const rooms = useRooms();
  const routers = useRouters();
  const plans = usePlans();

  const [form, setForm] = useState<ClientInput>({
    full_name: '',
    pppoe_username: '',
    room_id: null,
    router_id: null,
    plan_id: null,
    monthly_fee: 0,
    account_status: 'active',
    notes: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        full_name: existing.full_name,
        pppoe_username: existing.pppoe_username,
        room_id: existing.room_id,
        router_id: existing.router_id,
        plan_id: existing.plan_id,
        monthly_fee: existing.monthly_fee,
        account_status: existing.account_status,
        notes: existing.notes,
      });
    }
  }, [existing]);

  function set<K extends keyof ClientInput>(key: K, value: ClientInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    const err = isEdit && id ? await updateClient(id, form) : await createClient(form);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    navigate(-1);
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('Remove this client? They will be hidden but history is kept.')) return;
    setBusy(true);
    const err = await softDeleteClient(id);
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    navigate('/clients', { replace: true });
  }

  // When a plan is chosen, default the monthly fee to its price.
  function handlePlanChange(planId: string) {
    const plan = plans?.find((p) => p.id === planId);
    setForm((f) => ({
      ...f,
      plan_id: planId || null,
      monthly_fee: plan && f.monthly_fee === 0 ? plan.price : f.monthly_fee,
    }));
  }

  return (
    <Screen title={isEdit ? 'Edit client' : 'New client'} back>
      {!online && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-warn">
          Client editing needs a connection. Go online and try again.
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="full_name" className="text-sm font-medium text-slate-700">Full name</label>
          <input
            id="full_name"
            type="text"
            required
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="pppoe_username" className="text-sm font-medium text-slate-700">PPPoE username</label>
          <input
            id="pppoe_username"
            type="text"
            required
            autoCapitalize="none"
            autoCorrect="off"
            value={form.pppoe_username}
            onChange={(e) => set('pppoe_username', e.target.value.trim())}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="room" className="text-sm font-medium text-slate-700">Room</label>
          <select
            id="room"
            value={form.room_id ?? ''}
            onChange={(e) => {
              const roomId = e.target.value || null;
              const roomRouter = routers?.find((r) => r.room_id === roomId);
              setForm((f) => ({ ...f, room_id: roomId, router_id: roomRouter?.id ?? null }));
            }}
            className={inputClass}
          >
            <option value="">No room</option>
            {(rooms ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="plan" className="text-sm font-medium text-slate-700">Plan</label>
          <select
            id="plan"
            value={form.plan_id ?? ''}
            onChange={(e) => handlePlanChange(e.target.value)}
            className={inputClass}
          >
            <option value="">No plan</option>
            {(plans ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — ₱{p.price} / {p.duration_days}d
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="monthly_fee" className="text-sm font-medium text-slate-700">Monthly fee</label>
          <input
            id="monthly_fee"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            value={form.monthly_fee}
            onChange={(e) => set('monthly_fee', Number(e.target.value))}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="account_status" className="text-sm font-medium text-slate-700">Account status</label>
          <select
            id="account_status"
            value={form.account_status}
            onChange={(e) => set('account_status', e.target.value as AccountStatus)}
            className={inputClass}
          >
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="text-sm font-medium text-slate-700">Notes</label>
          <textarea
            id="notes"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy || !online}
          className="min-h-[48px] w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white active:opacity-80 disabled:opacity-50"
        >
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add client'}
        </button>

        {isEdit && (
          <button
            type="button"
            disabled={busy || !online}
            onClick={() => void handleDelete()}
            className="min-h-[48px] w-full rounded-xl bg-red-50 px-4 py-3 font-semibold text-danger active:opacity-70 disabled:opacity-50"
          >
            Remove client
          </button>
        )}
      </form>
    </Screen>
  );
}
