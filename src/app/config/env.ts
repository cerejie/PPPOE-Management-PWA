/**
 * Every environment value the app reads, validated once at module load so a
 * missing variable fails at startup with a clear message rather than as an
 * opaque network error later.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env and fill in your project values.`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    'VITE_SUPABASE_URL',
    import.meta.env.VITE_SUPABASE_URL as string | undefined,
  ),
  supabaseAnonKey: required(
    'VITE_SUPABASE_ANON_KEY',
    import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  ),
  /** Domain used to build synthetic login emails for staff usernames. */
  staffEmailDomain:
    (import.meta.env.VITE_STAFF_EMAIL_DOMAIN as string | undefined) ?? 'pppoe.local',
} as const;
