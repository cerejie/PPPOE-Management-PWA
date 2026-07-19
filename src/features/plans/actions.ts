import { supabase } from '@/lib/supabase';
import { pullAll } from '@/lib/sync';
import type { Plan } from '@/lib/types';

// SuperAdmin CRUD for plans. Online-only, matching clients and rooms.

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
  const { error } = await supabase.from('plans').insert({ ...input, name: input.name.trim() });
  if (error) return error.message;
  await pullAll();
  return null;
}

export async function updatePlan(id: string, input: PlanInput): Promise<string | null> {
  const { error } = await supabase
    .from('plans')
    .update({ ...input, name: input.name.trim() })
    .eq('id', id);
  if (error) return error.message;
  await pullAll();
  return null;
}

/**
 * Soft-delete a plan. Refused while clients are still on it: clients.plan_id
 * references plans(id), and every read path filters soft-deleted plans out, so
 * removing one in use would leave those clients showing no plan at all.
 */
export async function softDeletePlan(id: string): Promise<string | null> {
  const { count, error: countError } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', id)
    .is('deleted_at', null);

  if (countError) return countError.message;
  if (count && count > 0) {
    return `${count} client${
      count === 1 ? ' is' : 's are'
    } still on this plan. Move them to another plan first.`;
  }

  const { error } = await supabase
    .from('plans')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return error.message;

  await pullAll();
  return null;
}

/** True while the plan may still be assigned to new clients. */
export function isPlanOfferable(plan: Plan): boolean {
  if (plan.deleted_at) return false;
  if (!plan.valid_until) return true;
  return new Date(plan.valid_until).getTime() >= Date.now();
}
