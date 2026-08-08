// Domain types mirroring the Supabase schema.

export interface Plan {
  readonly id: string;
  name: string;
  price: number;
  /** Days a payment on this plan extends the client's expires_at. */
  duration_days: number;
  /** Advertised downstream speed. 0 = unspecified. */
  mbps: number;
  /** Date the plan stops being offered to new clients. Null = always offered. */
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
