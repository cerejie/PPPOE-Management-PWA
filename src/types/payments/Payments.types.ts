// Domain types mirroring the Supabase schema.

export interface Payment {
  readonly id: string;
  client_id: string;
  amount: number;
  paid_at: string;
  method: string | null;
  covers_from: string | null;
  covers_to: string | null;
  recorded_by: string | null;
  note: string | null;
  client_uuid: string;
  created_at: string;
  updated_at: string;
}
