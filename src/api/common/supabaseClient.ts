import { createClient } from '@supabase/supabase-js';
import { env } from '@/app/config/env';

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export const STAFF_EMAIL_DOMAIN = env.staffEmailDomain;

/** Deterministically map a staff username to its synthetic login email. */
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${STAFF_EMAIL_DOMAIN}`;
}
