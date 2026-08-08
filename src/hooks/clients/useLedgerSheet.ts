import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { deleteLedgerEntry } from '@/services/payments/Payments.service';
import {
  useClientLedger,
  type Ledger,
  type LedgerEntry,
} from '@/hooks/clients/useClientLedger';
import type { LedgerKind } from '@/types/clients/Clients.types';
import type { Client } from '@/types/clients/Clients.types';
import type { Plan } from '@/types/plans/Plans.types';
import type { Room } from '@/types/rooms/Rooms.types';

interface LedgerSheetState {
  filter: LedgerKind | 'all';
  exporting: boolean;
  exportError: string | null;
  /** The row awaiting confirmation; null when no dialog is open. */
  confirming: LedgerEntry | null;
  deleting: boolean;
  deleteError: string | null;
}

interface LedgerSheetInput {
  client: Client;
  room: Room | undefined;
  plan: Plan | undefined;
}

export interface LedgerSheetViewModel {
  /** Undefined while Dexie is still answering. */
  readonly ledger: Ledger | undefined;
  readonly entries: readonly LedgerEntry[];
  readonly filter: LedgerKind | 'all';
  readonly canDelete: boolean;
  readonly confirming: LedgerEntry | null;
  readonly deleting: boolean;
  readonly deleteError: string | null;
  readonly exporting: boolean;
  readonly exportError: string | null;
  readonly canExport: boolean;
  setFilter: (filter: LedgerKind | 'all') => void;
  requestDelete: (entry: LedgerEntry) => void;
  cancelDelete: () => void;
  confirmDelete: () => void;
  exportPdf: () => void;
}

/** Filtering, deletion and PDF export for one client's ledger. */
export function useLedgerSheet({ client, room, plan }: LedgerSheetInput): LedgerSheetViewModel {
  const ledger = useClientLedger(client.id);
  const { appUser, isSuperAdmin } = useAuth();

  const store = useInstanceStore<LedgerSheetState>(() => ({
    filter: 'all',
    exporting: false,
    exportError: null,
    confirming: null,
    deleting: false,
    deleteError: null,
  }));

  const { filter, exporting, exportError, confirming, deleting, deleteError } = useStore(
    store,
    useShallow((s) => s),
  );

  const entries =
    ledger === undefined
      ? []
      : filter === 'all'
        ? ledger.entries
        : ledger.entries.filter((e) => e.kind === filter);

  async function runDelete() {
    const target = store.getState().confirming;
    if (!target || store.getState().deleting) return;

    store.setState({ deleting: true, deleteError: null });
    const err = await deleteLedgerEntry({
      id: target.id,
      kind: target.kind,
      queued: target.pending || target.failed,
    });
    store.setState({ deleting: false, confirming: null, deleteError: err });
  }

  async function runExport() {
    if (!ledger || store.getState().exporting) return;

    store.setState({ exporting: true, exportError: null });
    try {
      // jsPDF (plus its html2canvas/dompurify deps) is ~380 KB — loaded only
      // when someone actually exports. The service worker still precaches the
      // chunk, so this keeps working offline.
      const { exportLedgerPdf } = await import('@/utils/clients/ClientLedgerPdf.utils');
      await exportLedgerPdf({
        client,
        room,
        plan,
        ledger,
        exportedBy: appUser?.display_name ?? 'unknown',
      });
    } catch {
      store.setState({ exportError: 'Could not generate the PDF. Please try again.' });
    } finally {
      store.setState({ exporting: false });
    }
  }

  return {
    ledger,
    entries,
    filter,
    canDelete: isSuperAdmin,
    confirming,
    deleting,
    deleteError,
    exporting,
    exportError,
    canExport: ledger !== undefined && ledger.entries.length > 0,
    setFilter: (next) => store.setState({ filter: next }),
    requestDelete: (entry) => store.setState({ confirming: entry }),
    cancelDelete: () => store.setState({ confirming: null }),
    confirmDelete: () => void runDelete(),
    exportPdf: () => void runExport(),
  };
}
