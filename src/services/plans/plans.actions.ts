import { db } from '@/api/common/db';
import { newUuid } from '@/utils/common/format';
import { queueEntityWrite, settleWrite } from '@/api/sync/syncEngine';
import type { Plan } from '@/types/plans/plans.types';

// SuperAdmin CRUD for plans. Queued through the outbox like clients and rooms,
// so plans can be created and edited offline.

export interface PlanInput {
  name: string;
  price: number;
  /** Days a payment on this plan extends the client's expires_at. */
  duration_days: number;
  mbps: number;
  /** ISO date the plan stops being offered to new clients. Null = always. */
  valid_until: string | null;
}

export async function createPlan(input: PlanInput): Promise<string | null> {
  const now = new Date().toISOString();
  const plan: Plan = {
    id: newUuid(),
    ...input,
    name: input.name.trim(),
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const uuid = await queueEntityWrite({
    table: 'plans',
    op: 'insert',
    row_id: plan.id,
    values: plan,
  });
  return settleWrite(uuid);
}

export async function updatePlan(id: string, input: PlanInput): Promise<string | null> {
  const uuid = await queueEntityWrite({
    table: 'plans',
    op: 'update',
    row_id: id,
    values: { ...input, name: input.name.trim(), updated_at: new Date().toISOString() },
  });
  return settleWrite(uuid);
}

/**
 * Soft-delete a plan. Refused while clients are still on it: clients.plan_id
 * references plans(id), and every read path filters soft-deleted plans out, so
 * removing one in use would leave those clients showing no plan at all.
 *
 * Counted from the local mirror so the guard still holds offline.
 */
export async function softDeletePlan(id: string): Promise<string | null> {
  const assigned = (await db.clients.where('plan_id').equals(id).toArray()).filter(
    (c) => !c.deleted_at,
  ).length;

  if (assigned > 0) {
    return `${assigned} client${
      assigned === 1 ? ' is' : 's are'
    } still on this plan. Move them to another plan first.`;
  }

  const uuid = await queueEntityWrite({
    table: 'plans',
    op: 'update',
    row_id: id,
    values: { deleted_at: new Date().toISOString() },
  });
  return settleWrite(uuid);
}

/** True while the plan may still be assigned to new clients. */
export function isPlanOfferable(plan: Plan): boolean {
  if (plan.deleted_at) return false;
  if (!plan.valid_until) return true;
  return new Date(plan.valid_until).getTime() >= Date.now();
}
