import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '@/components/Screen';
import { StatusDot } from '@/components/StatusDot';
import { ExpiryBadge } from '@/components/ExpiryBadge';
import { useAuth } from '@/features/auth/AuthContext';
import type { ConnectionStatus } from '@/lib/types';
import { useClients, useRooms, type ClientFilters, type ExpiryFilter } from './hooks';

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
      className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
        active ? 'bg-accent text-white' : 'bg-white text-slate-600 shadow-sm'
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

  const filters: ClientFilters = useMemo(
    () => ({
      search,
      status: isStatus(params.get('status')) ? (params.get('status') as ConnectionStatus) : 'all',
      roomId: params.get('room') ?? 'all',
      expiry: isExpiry(params.get('expiry')) ? (params.get('expiry') as ExpiryFilter) : 'all',
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
    <Screen
      title="Clients"
      action={
        isSuperAdmin ? (
          <button
            type="button"
            onClick={() => navigate('/clients/new')}
            aria-label="Add client"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white active:opacity-60"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        ) : undefined
      }
    >
      <input
        type="search"
        inputMode="search"
        placeholder="Search name or PPPoE username"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
      />

      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <FilterChip active={filters.status === 'all' && filters.expiry === 'all'} onClick={() => {
          setParams(filters.roomId !== 'all' ? new URLSearchParams({ room: filters.roomId }) : new URLSearchParams(), { replace: true });
        }}>
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
          onClick={() => setParam('status', filters.status === 'disconnected' ? null : 'disconnected')}
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
      </div>

      {roomName && (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-accent-soft px-4 py-2.5">
          <span className="text-sm font-medium text-accent-text">Room: {roomName}</span>
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
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-muted shadow-sm">
          No clients match.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm">
          {clients.map((c) => {
            const room = rooms?.find((r) => r.id === c.room_id);
            return (
              <li key={c.id}>
                <Link
                  to={`/clients/${c.id}`}
                  className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3 active:bg-slate-50"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StatusDot status={c.connection_status} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{c.full_name}</p>
                      <p className="truncate text-xs text-muted">
                        {c.pppoe_username}
                        {room ? ` · ${room.name}` : ''}
                      </p>
                    </div>
                  </div>
                  <ExpiryBadge expiresAt={c.expires_at} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
