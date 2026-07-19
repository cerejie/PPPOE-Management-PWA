import { Link, useNavigate } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { StatusDot } from '@/components/StatusDot';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { formatDate } from '@/lib/format';
import { useDashboardStats } from './hooks';

interface StatCardProps {
  label: string;
  value: number;
  tone: 'ok' | 'muted' | 'warn' | 'danger';
  to: string;
}

const toneClasses: Record<StatCardProps['tone'], string> = {
  ok: 'text-ok',
  muted: 'text-slate-500',
  warn: 'text-warn',
  danger: 'text-danger',
};

function StatCard({ label, value, tone, to }: StatCardProps) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="min-h-[44px] rounded-2xl bg-white p-4 text-left shadow-sm active:opacity-70"
    >
      <p className={`text-3xl font-bold tabular-nums ${toneClasses[tone]}`}>{value}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
    </button>
  );
}

export function DashboardScreen() {
  const stats = useDashboardStats();

  return (
    <Screen title="Dashboard">
      {stats === undefined ? (
        <p className="py-16 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Connected" value={stats.connected} tone="ok" to="/clients?status=connected" />
            <StatCard label="Disconnected" value={stats.disconnected} tone="muted" to="/clients?status=disconnected" />
            <StatCard label="Expiring in 7 days" value={stats.expiring7d} tone="warn" to="/clients?expiry=expiring" />
            <StatCard label="Expired" value={stats.expired} tone="danger" to="/clients?expiry=expired" />
          </div>

          <h2 className="mb-2 mt-6 text-sm font-semibold text-slate-700">
            Soonest expirations
          </h2>
          {stats.soonest.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-muted shadow-sm">
              No upcoming expirations.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
              {stats.soonest.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/clients/${c.id}`}
                    className="flex min-h-[56px] items-center justify-between gap-3 px-4 py-3 active:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StatusDot status={c.connection_status} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{c.full_name}</p>
                        <p className="truncate text-xs text-muted">
                          {formatDate(c.expires_at)}
                        </p>
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
