import { supabase } from '@/lib/supabase';
import { pullAll } from '@/lib/sync';
import type { AccountStatus } from '@/lib/types';

// SuperAdmin CRUD. These are online-only (admin edits are rare and need
// immediate server confirmation); offline entry is reserved for payments and
// connection events per the sync design.

export interface ClientInput {
  full_name: string;
  pppoe_username: string;
  room_id: string | null;
  router_id: string | null;
  plan_id: string | null;
  monthly_fee: number;
  account_status: AccountStatus;
  notes: string | null;
}

export async function createClient(input: ClientInput): Promise<string | null> {
  const { error } = await supabase.from('clients').insert(input);
  if (error) return error.message;
  await pullAll();
  return null;
}

export async function updateClient(id: string, input: ClientInput): Promise<string | null> {
  const { error } = await supabase.from('clients').update(input).eq('id', id);
  if (error) return error.message;
  await pullAll();
  return null;
}

export async function softDeleteClient(id: string): Promise<string | null> {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return error.message;
  await pullAll();
  return null;
}
