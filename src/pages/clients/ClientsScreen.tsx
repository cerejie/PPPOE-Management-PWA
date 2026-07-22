import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/common/layout/Screen';
import { Fab } from '@/components/common/buttons/Fab';
import { StatusDot } from '@/components/common/badges/StatusDot';
import { ExpiryBadge } from '@/components/common/badges/ExpiryBadge';
import { SyncBadge } from '@/components/common/badges/SyncBadge';
import { useAuth } from '@/store/auth/AuthContext';
import { useEntitySync } from '@/hooks/sync/useEntitySync';
import type { ConnectionStatus } from '@/types/clients/clients.types';
import { useClients, type ClientFilters, type ExpiryFilter } from '@/hooks/clients/useClients';
import { useRooms } from '@/hooks/rooms/useRooms';

function isStatus(v: string | null): v is ConnectionStatus {
  return v === 'connected' || v === 'disconnected';
}
function isExpiry(v: string | null): v is ExpiryFilter {
  return v === 'expiring' || v === 'expired';
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: string;
}

function FilterChip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[38px] shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'bg-accent-gradient text-white shadow-float' : 'bg-surface text-muted shadow-card'
      } active:opacity-70`}
    >
      {children}
    </button>
  );
}

export function ClientsScreen() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const rooms = useRooms();
  const unsynced = useEntitySync('clients');

  const filters: ClientFilters = useMemo(
    () => ({
      search,
      status: isStatus(params.get('status')) ? (params.get('status') as ConnectionStatus) : 'all',
      roomId: params.get('room') ?? 'all',
      expiry: isExpiry(params.get('expiry')) ? (params.get('expiry') as ExpiryFilter) : 'all',
      paused: params.get('paused') === '1' ? 'only' : 'all',
    }),
    [search, params],
  );

  const clients = useClients(filters);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const roomName =
    filters.roomId !== 'all' ? rooms?.find((r) => r.id === filters.roomId)?.name : undefined;

  return (
    <>
      <Screen title="Clients" eyebrow={clients ? `${clients.length} shown` : undefined}>
        <div className="relative mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Search name or PPPoE username"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search clients"
            className="block w-full rounded-2xl border border-line bg-surface py-3 pl-11 pr-4 text-base text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-accent focus:ring-4 focus:ring-accent/15"
          />
        </div>

        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          <FilterChip
            active={
              filters.status === 'all' && filters.expiry === 'all' && filters.paused === 'all'
            }
            onClick={() => {
              setParams(
                filters.roomId !== 'all'
                  ? new URLSearchParams({ room: filters.roomId })
                  : new URLSearchParams(),
                { replace: true },
              );
            }}
          >
            All
          </FilterChip>
          <FilterChip
            active={filters.status === 'connected'}
            onClick={() => setParam('status', filters.status === 'connected' ? null : 'connected')}
          >
            Connected
          </FilterChip>
          <FilterChip
            active={filters.status === 'disconnected'}
            onClick={() =>
              setParam('status', filters.status === 'disconnected' ? null : 'disconnected')
            }
          >
            Disconnected
          </FilterChip>
          <FilterChip
            active={filters.expiry === 'expiring'}
            onClick={() => setParam('expiry', filters.expiry === 'expiring' ? null : 'expiring')}
          >
            Expiring 7d
          </FilterChip>
          <FilterChip
            active={filters.expiry === 'expired'}
            onClick={() => setParam('expiry', filters.expiry === 'expired' ? null : 'expired')}
          >
            Expired
          </FilterChip>
          <FilterChip
            active={filters.paused === 'only'}
            onClick={() => setParam('paused', filters.paused === 'only' ? null : '1')}
          >
            Paused
          </FilterChip>
        </div>

        {roomName && (
          <div className="mb-3 flex items-center justify-between rounded-2xl bg-accent-soft px-4 py-2.5">
            <span className="text-sm font-semibold text-accent-text">Room: {roomName}</span>
            <button
              type="button"
              onClick={() => setParam('room', null)}
              className="min-h-[36px] text-sm font-semibold text-accent-text active:opacity-60"
            >
              Clear
            </button>
          </div>
        )}

        {clients === undefined ? (
          <p className="py-16 text-center text-sm text-muted">Loading…</p>
        ) : clients.length === 0 ? (
          <div className="rounded-3xl bg-surface p-10 text-center shadow-card">
            <p className="text-3xl">🔍</p>
            <p className="mt-3 font-semibold text-fg">No clients match</p>
            <p className="mt-1 text-sm text-muted">Try clearing the filters or the search.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {clients.map((c) => {
              const room = rooms?.find((r) => r.id === c.room_id);
              return (
                <li key={c.id}>
                  <Link
                    to={`/clients/${c.id}`}
                    className="flex min-h-[72px] items-center justify-between gap-3 rounded-3xl bg-surface px-4 py-3 shadow-card transition-transform active:scale-[0.98]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <StatusDot status={c.connection_status} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-fg">{c.full_name}</p>
                        <p className="truncate text-xs text-muted">
                          {c.pppoe_username}
                          {room ? ` · ${room.name}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <SyncBadge state={unsynced.get(c.id)} />
                      <ExpiryBadge expiresAt={c.expires_at} pausedAt={c.paused_at} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Screen>

      {isSuperAdmin && <Fab onClick={() => navigate('/clients/new')} label="Add client" />}
    </>
  );
}
