import { useState } from 'react';
import { Sheet } from '@/components/common/overlays/Sheet';
import { useAuth } from '@/store/auth/AuthContext';
import { formatDateTime, formatDuration, formatMoney } from '@/utils/common/format';
import type { Client } from '@/types/clients/clients.types';
import type { Plan } from '@/types/plans/plans.types';
import type { Room } from '@/types/rooms/rooms.types';
import { useClientLedger, type LedgerEntry, type LedgerKind } from '@/hooks/clients/useClientLedger';

interface Props {
  client: Client;
  room: Room | undefined;
  plan: Plan | undefined;
  onClose: () => void;
}

const KIND_STYLE: Record<LedgerKind, { icon: string; chip: string }> = {
  payment: { icon: '₱', chip: 'bg-accent-soft text-accent-text' },
  connection: { icon: '⇄', chip: 'bg-surface-2 text-muted' },
  pause: { icon: '❚❚', chip: 'bg-warn-soft text-warn' },
};

const FILTERS: { id: LedgerKind | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Payments' },
  { id: 'connection', label: 'Connection' },
  { id: 'pause', label: 'Pauses' },
];

function Row({ entry }: { entry: LedgerEntry }) {
  const style = KIND_STYLE[entry.kind];

  return (
    <li className="flex items-start gap-3 border-b border-line/60 py-3 last:border-b-0">
      <span
        aria-hidden
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style.chip}`}
      >
        {style.icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">
          {entry.title}
          {entry.pending && <span className="ml-2 text-[11px] font-medium text-warn">pending</span>}
          {entry.failed && <span className="ml-2 text-[11px] font-medium text-danger">failed</span>}
        </p>
        <p className="truncate text-xs text-muted">
          {formatDateTime(entry.at)}
          {entry.detail ? ` · ${entry.detail}` : ''}
        </p>
      </div>

      {entry.amount !== null && (
        <span
          className={`shrink-0 text-sm font-semibold tabular-nums ${
            entry.amount < 0 ? 'text-danger' : 'text-fg'
          }`}
        >
          {formatMoney(entry.amount)}
        </span>
      )}
    </li>
  );
}

/** Full client history — payments, connection events and pauses — plus PDF export. */
export function LedgerSheet({ client, room, plan, onClose }: Props) {
  const ledger = useClientLedger(client.id);
  const { appUser } = useAuth();
  const [filter, setFilter] = useState<LedgerKind | 'all'>('all');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const visible =
    filter === 'all' ? ledger?.entries : ledger?.entries.filter((e) => e.kind === filter);

  async function handleExport() {
    if (!ledger || exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      // jsPDF (plus its html2canvas/dompurify deps) is ~380 KB — loaded only
      // when someone actually exports. The service worker still precaches the
      // chunk, so this keeps working offline.
      const { exportLedgerPdf } = await import('@/utils/clients/ledgerPdf');
      await exportLedgerPdf({
        client,
        room,
        plan,
        ledger,
        exportedBy: appUser?.display_name ?? 'unknown',
      });
    } catch {
      setExportError('Could not generate the PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Sheet title="Ledger" subtitle={client.full_name} onClose={onClose}>
      {ledger === undefined ? (
        <p className="py-12 text-center text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Total paid
              </p>
              <p className="mt-0.5 text-lg font-bold tabular-nums text-fg">
                {formatMoney(ledger.totalPaid)}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-2 px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                Paused time credited
              </p>
              <p className="mt-0.5 text-lg font-bold text-fg">
                {formatDuration(ledger.totalCredited)}
              </p>
            </div>
          </div>

          <div className="-mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`min-h-[36px] shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  filter === f.id ? 'bg-accent-gradient text-white' : 'bg-surface-2 text-muted'
                } active:opacity-70`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible && visible.length > 0 ? (
            <ul className="mt-1">
              {visible.map((entry) => (
                <Row key={entry.id} entry={entry} />
              ))}
            </ul>
          ) : (
            <p className="py-12 text-center text-sm text-muted">Nothing recorded yet.</p>
          )}

          {ledger.truncated && (
            <p className="mt-2 rounded-2xl bg-surface-2 px-4 py-3 text-xs text-muted">
              Older history is not stored on this device — payments are mirrored for 6 months and
              events for the most recent 500 entries.
            </p>
          )}

          {exportError && (
            <p role="alert" className="mt-3 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {exportError}
            </p>
          )}

          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || ledger.entries.length === 0}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-surface-2 px-4 py-3.5 font-semibold text-fg active:opacity-70 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {exporting ? 'Preparing…' : 'Export as PDF'}
          </button>
        </>
      )}
    </Sheet>
  );
}
