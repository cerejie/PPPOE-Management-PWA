// Domain types mirroring the Supabase schema.

export interface Room {
  readonly id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Router {
  readonly id: string;
  room_id: string | null;
  label: string;
  model: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
