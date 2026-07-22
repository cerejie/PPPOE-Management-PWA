import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/common/layout/Screen';
import { ConfirmDialog } from '@/components/common/overlays/ConfirmDialog';
import {
  dangerButtonClass,
  fieldClass,
  labelClass,
  primaryButtonClass,
} from '@/styles/common/formStyles';
import { isPlanOfferable } from '@/services/plans/plans.actions';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import {
  formatDate,
  fromDateInputStart,
  toDateInputValue,
  todayInputValue,
} from '@/utils/common/format';
import type { AccountStatus } from '@/types/clients/clients.types';
import {
  createClient,
  initialExpiry,
  softDeleteClient,
  updateClient,
  type ClientInput,
} from '@/services/clients/clients.actions';
import { useClient } from '@/hooks/clients/useClients';
import { usePlans } from '@/hooks/plans/usePlans';
import { useRooms } from '@/hooks/rooms/useRooms';
import { useRouters } from '@/hooks/rooms/useRouters';

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

  const [form, setForm] = useState<ClientInput>(() => ({
    full_name: '',
    pppoe_username: '',
    room_id: null,
    router_id: null,
    plan_id: null,
    monthly_fee: 0,
    account_status: 'active',
    installed_at: fromDateInputStart(todayInputValue()),
    notes: null,
  }));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

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
        installed_at: existing.installed_at,
        notes: existing.notes,
      });
    }
  }, [existing]);

  // Retired plans stay listed for the client already on them, so editing an
  // unrelated field can't silently drop their plan.
  const selectablePlans = useMemo(
    () => (plans ?? []).filter((p) => isPlanOfferable(p) || p.id === form.plan_id),
    [plans, form.plan_id],
  );

  const durationDays =
    plans?.find((p) => p.id === form.plan_id)?.duration_days ?? 30;
  // Only creation derives the expiry from the install date, so only creation
  // previews it. On an existing client expires_at has moved on with payments.
  const seededExpiry = isEdit ? null : initialExpiry(form.installed_at, durationDays);

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
    setBusy(true);
    const err = await softDeleteClient(id);
    setBusy(false);
    setConfirmingDelete(false);
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
    <>
      <Screen title={isEdit ? 'Edit client' : 'New client'} back>
        {!online && (
          <p className="mb-4 rounded-2xl bg-warn-soft px-4 py-3 text-sm text-warn">
            Client editing needs a connection. Go online and try again.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="full_name" className={labelClass}>
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="pppoe_username" className={labelClass}>
              PPPoE username
            </label>
            <input
              id="pppoe_username"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={form.pppoe_username}
              onChange={(e) => set('pppoe_username', e.target.value.trim())}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="room" className={labelClass}>
              Room
            </label>
            <select
              id="room"
              value={form.room_id ?? ''}
              onChange={(e) => {
                const roomId = e.target.value || null;
                const roomRouter = routers?.find((r) => r.room_id === roomId);
                setForm((f) => ({ ...f, room_id: roomId, router_id: roomRouter?.id ?? null }));
              }}
              className={fieldClass}
            >
              <option value="">No room</option>
              {(rooms ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="plan" className={labelClass}>
              Plan
            </label>
            <select
              id="plan"
              value={form.plan_id ?? ''}
              onChange={(e) => handlePlanChange(e.target.value)}
              className={fieldClass}
            >
              <option value="">No plan</option>
              {selectablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₱{p.price}
                  {p.mbps > 0 ? ` · ${p.mbps} Mbps` : ''} · {p.duration_days}d
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="installed_at" className={labelClass}>
              Date installed
            </label>
            <input
              id="installed_at"
              type="date"
              value={toDateInputValue(form.installed_at)}
              onChange={(e) => set('installed_at', fromDateInputStart(e.target.value))}
              className={fieldClass}
            />
            {!isEdit && (
              <p className="mt-1.5 text-xs text-muted">
                {seededExpiry
                  ? `First expiry: ${formatDate(seededExpiry)} (${durationDays} days).`
                  : 'Leave empty to start with no expiry until the first payment.'}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="monthly_fee" className={labelClass}>
              Monthly fee
            </label>
            <input
              id="monthly_fee"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={form.monthly_fee}
              onChange={(e) => set('monthly_fee', Number(e.target.value))}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="account_status" className={labelClass}>
              Account status
            </label>
            <select
              id="account_status"
              value={form.account_status}
              onChange={(e) => set('account_status', e.target.value as AccountStatus)}
              className={`${fieldClass} capitalize`}
            >
              {ACCOUNT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className={labelClass}>
              Notes <span className="font-normal text-muted/70">(optional)</span>
            </label>
            <textarea
              id="notes"
              rows={3}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              className={fieldClass}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !online} className={primaryButtonClass}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Add client'}
          </button>

          {isEdit && (
            <button
              type="button"
              disabled={busy || !online}
              onClick={() => setConfirmingDelete(true)}
              className={dangerButtonClass}
            >
              Remove client
            </button>
          )}
        </form>
      </Screen>

      {confirmingDelete && (
        <ConfirmDialog
          title="Remove client?"
          message="They will be hidden from the app, but their payment and connection history is kept."
          confirmLabel="Remove"
          busy={busy}
          onConfirm={() => void handleDelete()}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
