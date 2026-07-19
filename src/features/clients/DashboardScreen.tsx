import { Link, useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { StatusDot } from '@/components/StatusDot';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { useAuth } from '@/features/auth/AuthContext';
import { formatDate, formatMoney } from '@/lib/format';
import { useDashboardStats } from './hooks';

interface StatCardProps {
  label: string;
  value: number;
  tone: 'ok' | 'muted' | 'warn' | 'danger';
  to: string;
}

const toneClasses: Record<StatCardProps['tone'], string> = {
  ok: 'text-ok',
  muted: 'text-fg',
  warn: 'text-warn',
  danger: 'text-danger',
};

const toneDots: Record<StatCardProps['tone'], string> = {
  ok: 'bg-ok',
  muted: 'bg-muted',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

function StatCard({ label, value, tone, to }: StatCardProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="rounded-3xl bg-surface p-4 text-left shadow-card transition-transform active:scale-[0.97]"
    >
      <span className={`inline-block h-2 w-2 rounded-full ${toneDots[tone]}`} aria-hidden />
      <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${toneClasses[tone]}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-muted">{label}</p>
    </button>
  );
}

export function DashboardScreen() {
  const stats = useDashboardStats();
  const { appUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const firstName = appUser?.display_name?.split(' ')[0] ?? 'there';

  return (
    <Screen title={`Hi, ${firstName}`} eyebrow="Welcome back">
      {stats === undefined ? (
        <p className="py-16 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          {/* Hero: the one number that matters, plus a shortcut to add a client. */}
          <section className="relative overflow-hidden rounded-4xl bg-accent-gradient p-5 text-white shadow-float">
            <div
              className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full bg-white/10"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-black/10"
              aria-hidden
            />

            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white/75">Monthly recurring</p>
                <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">
                  {formatMoney(stats.monthlyRevenue)}
                </p>
              </div>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => navigate('/clients/new')}
                  aria-label="Add client"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur active:opacity-70"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="relative mt-5 flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                {stats.total} client{stats.total === 1 ? '' : 's'}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                {stats.connected} online
              </span>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatCard
              label="Connected"
              value={stats.connected}
              tone="ok"
              to="/clients?status=connected"
            />
            <StatCard
              label="Disconnected"
              value={stats.disconnected}
              tone="muted"
              to="/clients?status=disconnected"
            />
            <StatCard
              label="Expiring in 7 days"
              value={stats.expiring7d}
              tone="warn"
              to="/clients?expiry=expiring"
            />
            <StatCard
              label="Expired"
              value={stats.expired}
              tone="danger"
              to="/clients?expiry=expired"
            />
          </div>

          <div className="mb-2 mt-7 flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight text-fg">Soonest expirations</h2>
            <Link to="/clients" className="text-sm font-semibold text-accent-text active:opacity-60">
              See all
            </Link>
          </div>

          {stats.soonest.length === 0 ? (
            <div className="rounded-3xl bg-surface p-8 text-center shadow-card">
              <p className="text-sm text-muted">No upcoming expirations.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {stats.soonest.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/clients/${c.id}`}
                    className="flex min-h-[68px] items-center justify-between gap-3 rounded-3xl bg-surface px-4 py-3 shadow-card transition-transform active:scale-[0.98]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StatusDot status={c.connection_status} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{c.full_name}</p>
                        <p className="truncate text-xs text-muted">{formatDate(c.expires_at)}</p>
                      </div>
                    </div>
                    <ExpiryBadge expiresAt={c.expires_at} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Screen>
  );
}
