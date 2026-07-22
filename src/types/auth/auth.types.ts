// Domain types mirroring the Supabase schema.

export type AppRole = 'superadmin' | 'staff';

export interface AppUser {
  readonly id: string;
  username: string;
  display_name: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
