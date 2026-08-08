import { Sheet } from '@/common/components/overlays/Sheet';
import { ConfirmDialog } from '@/common/components/overlays/ConfirmDialog';
import { FilterChip } from '@/common/components/buttons/FilterChip';
import { LedgerRow } from '@/components/clients/sheet/LedgerRow';
import * as styles from '@/components/clients/sheet/LedgerSheet.css';
import { LEDGER_FILTERS } from '@/constants/clients/ClientLedger.constants';
import { useLedgerSheet } from '@/hooks/clients/useLedgerSheet';
import { describeLedgerDeletion } from '@/utils/clients/ClientLedger.utils';
import { formatDuration, formatMoney } from '@/common/utils/Format.utils';
import type { Client } from '@/types/clients/Clients.types';
import type { Plan } from '@/types/plans/Plans.types';
import type { Room } from '@/types/rooms/Rooms.types';

interface Props {
  client: Client;
  room: Room | undefined;
  plan: Plan | undefined;
  onClose: () => void;
}

/** Full client history — payments, connection events and pauses — plus PDF export. */
export function LedgerSheet({ client, room, plan, onClose }: Props) {
  const vm = useLedgerSheet({ client, room, plan });
  const { ledger } = vm;

  return (
    <>
      <Sheet title="Ledger" subtitle={client.full_name} onClose={onClose}>
        {ledger === undefined ? (
          <p className={styles.placeholder}>Loading…</p>
        ) : (
          <>
            <div className={styles.totals}>
              <div className={styles.totalCard}>
                <p className={styles.totalLabel}>Total paid</p>
                <p className={styles.totalValue}>{formatMoney(ledger.totalPaid)}</p>
              </div>
              <div className={styles.totalCard}>
                <p className={styles.totalLabel}>Paused time credited</p>
                <p className={styles.totalValue}>{formatDuration(ledger.totalCredited)}</p>
              </div>
            </div>

            <div className={styles.filterBar}>
              {LEDGER_FILTERS.map((option) => (
                <FilterChip
                  key={option.id}
                  tone="flat"
                  active={vm.filter === option.id}
                  onClick={() => vm.setFilter(option.id)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>

            {vm.entries.length > 0 ? (
              <ul className={styles.list}>
                {vm.entries.map((entry) => (
                  <LedgerRow
                    key={entry.id}
                    entry={entry}
                    onDelete={vm.canDelete ? () => vm.requestDelete(entry) : undefined}
                  />
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>Nothing recorded yet.</p>
            )}

            {vm.deleteError && (
              <p role="alert" className={styles.alert}>
                {vm.deleteError}
              </p>
            )}

            {ledger.truncated && (
              <p className={styles.truncationNotice}>
                Older history is not stored on this device — payments are mirrored for 6 months and
                events for the most recent 500 entries.
              </p>
            )}

            {vm.exportError && (
              <p role="alert" className={styles.alert}>
                {vm.exportError}
              </p>
            )}

            <button
              type="button"
              onClick={vm.exportPdf}
              disabled={vm.exporting || !vm.canExport}
              className={styles.exportButton}
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
              {vm.exporting ? 'Preparing…' : 'Export as PDF'}
            </button>
          </>
        )}
      </Sheet>

      {vm.confirming && (
        <ConfirmDialog
          title="Delete this entry?"
          message={describeLedgerDeletion(vm.confirming)}
          confirmLabel="Delete"
          busy={vm.deleting}
          onConfirm={vm.confirmDelete}
          onCancel={vm.cancelDelete}
        />
      )}
    </>
  );
}
