import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Screen } from '@/components/common/layout/Screen';
import { Fab } from '@/components/common/buttons/Fab';
import { SyncBadge } from '@/components/common/badges/SyncBadge';
import { useAuth } from '@/store/auth/AuthContext';
import { usePlans } from '@/hooks/plans/usePlans';
import { useEntitySync } from '@/hooks/sync/useEntitySync';
import { db } from '@/api/common/db';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import { formatDate, formatMoney } from '@/utils/common/format';
import type { Plan } from '@/types/plans/plans.types';
import { isPlanOfferable } from '@/services/plans/plans.actions';
import { PlanFormSheet } from '@/components/plans/sheets/PlanFormSheet';

/** How many live clients sit on each plan, for the subscriber count. */
function usePlanClientCounts(): Record<string, number> | undefined {
  return useLiveQuery(async () => {
    const clients = await db.clients.toArray();
    const counts: Record<string, number> = {};
    for (const c of clients) {
      if (c.deleted_at || !c.plan_id) continue;
      counts[c.plan_id] = (counts[c.plan_id] ?? 0) + 1;
    }
    return counts;
  }, []);
}

function PlanCard({
  plan,
  clientCount,
  onEdit,
  syncState,
}: {
  plan: Plan;
  clientCount: number;
  onEdit: (() => void) | null;
  syncState: EntityWriteState | undefined;
}) {
  const offerable = isPlanOfferable(plan);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-fg">{plan.name}</p>
          <p className="mt-0.5 text-xs text-muted">
            {clientCount} client{clientCount === 1 ? '' : 's'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xl font-bold tracking-tight text-fg tabular-nums">
            {formatMoney(plan.price)}
          </p>
          <p className="text-xs text-muted">
            per {plan.duration_days} day{plan.duration_days === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <SyncBadge state={syncState} />
        <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent-text">
          {plan.mbps > 0 ? `${plan.mbps} Mbps` : 'Speed not set'}
        </span>
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
          {plan.duration_days}-day validity
        </span>
        {plan.valid_until && (
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              offerable ? 'bg-warn-soft text-warn' : 'bg-danger-soft text-danger'
            }`}
          >
            {offerable
              ? `Offered until ${formatDate(plan.valid_until)}`
              : `Ended ${formatDate(plan.valid_until)}`}
          </span>
        )}
      </div>
    </>
  );

  if (!onEdit) {
    return <li className="rounded-3xl bg-surface p-4 shadow-card">{body}</li>;
  }

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="w-full rounded-3xl bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.98]"
      >
        {body}
      </button>
    </li>
  );
}

type Editing = Plan | 'new' | null;

export function PlansScreen() {
  const plans = usePlans();
  const counts = usePlanClientCounts();
  const { isSuperAdmin } = useAuth();
  const unsynced = useEntitySync('plans');
  const [editing, setEditing] = useState<Editing>(null);

  return (
    <>
      <Screen title="Plans" eyebrow={plans ? `${plans.length} total` : undefined}>
        {plans === undefined ? (
          <p className="py-16 text-center text-sm text-muted">Loading…</p>
        ) : plans.length === 0 ? (
          <div className="rounded-3xl bg-surface p-10 text-center shadow-card">
            <p className="text-3xl">🗂️</p>
            <p className="mt-3 font-semibold text-fg">No plans yet</p>
            <p className="mt-1 text-sm text-muted">
              {isSuperAdmin
                ? 'Tap + to create your first plan.'
                : 'An admin needs to add plans first.'}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                clientCount={counts?.[plan.id] ?? 0}
                onEdit={isSuperAdmin ? () => setEditing(plan) : null}
                syncState={unsynced.get(plan.id)}
              />
            ))}
          </ul>
        )}
      </Screen>

      {isSuperAdmin && <Fab onClick={() => setEditing('new')} label="Add plan" />}

      {editing === 'new' && <PlanFormSheet onClose={() => setEditing(null)} />}
      {editing && editing !== 'new' && (
        <PlanFormSheet plan={editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
