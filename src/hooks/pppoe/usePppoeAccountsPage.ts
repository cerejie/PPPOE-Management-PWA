import { useMemo } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { useOnline } from '@/hooks/sync/useSyncStatus';
import { useEntitySync } from '@/hooks/sync/useEntitySync';
import { usePppoeAccounts, usePppoeAccountHolders } from '@/hooks/pppoe/usePppoeAccounts';
import { importPppoeFromRouter } from '@/services/pppoe/Pppoe.service';
import { pluralize } from '@/common/utils/Format.utils';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { PppoeAccount } from '@/types/pppoe/Pppoe.types';
import type { PppoeFilter } from '@/constants/pppoe/PppoeAccounts.constants';

/** Which account the sheet is open for; 'new' for a blank one. */
export type PppoeEditTarget = PppoeAccount | 'new' | null;

interface PppoeAccountsPageState {
  search: string;
  filter: PppoeFilter;
  editing: PppoeEditTarget;
  importing: boolean;
  importError: string | null;
  importSummary: string | null;
}

export interface PppoeAccountsPageViewModel {
  readonly accounts: readonly PppoeAccount[] | undefined;
  readonly total: number;
  readonly search: string;
  readonly filter: PppoeFilter;
  readonly editing: PppoeEditTarget;
  readonly canEdit: boolean;
  readonly online: boolean;
  readonly importing: boolean;
  readonly importError: string | null;
  readonly importSummary: string | null;
  /** Empty-state copy, which differs by why the list is empty. */
  readonly emptyTitle: string;
  readonly emptyMessage: string;
  holderName: (accountId: string) => string | undefined;
  syncState: (accountId: string) => EntityWriteState | undefined;
  setSearch: (value: string) => void;
  setFilter: (value: PppoeFilter) => void;
  edit: (account: PppoeAccount) => void;
  create: () => void;
  closeForm: () => void;
  importFromRouter: () => void;
}

function matches(account: PppoeAccount, holder: string | undefined, query: string): boolean {
  const haystack = `${account.name} ${account.comment ?? ''} ${holder ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

function passesFilter(
  account: PppoeAccount,
  holder: string | undefined,
  filter: PppoeFilter,
): boolean {
  switch (filter) {
    case 'enabled':
      return !account.disabled;
    case 'disabled':
      return account.disabled;
    case 'unassigned':
      return holder === undefined;
    case 'missing':
      return !account.present_on_router;
    case 'all':
      return true;
  }
}

/**
 * The PPPoE tab.
 *
 * The list is the router's secret list, mirrored — enabled, disabled, assigned
 * or not, everything the MikroTik holds appears here. Import is the only action
 * that needs a connection; creating and editing go through the outbox like
 * every other write in the app.
 */
export function usePppoeAccountsPage(): PppoeAccountsPageViewModel {
  const accounts = usePppoeAccounts();
  const holders = usePppoeAccountHolders();
  const { isSuperAdmin } = useAuth();
  const online = useOnline();
  const unsynced = useEntitySync('pppoe_accounts');

  const store = useInstanceStore<PppoeAccountsPageState>(() => ({
    search: '',
    filter: 'all',
    editing: null,
    importing: false,
    importError: null,
    importSummary: null,
  }));

  const { search, filter, editing, importing, importError, importSummary } = useStore(
    store,
    useShallow((s) => s),
  );

  const query = search.trim().toLowerCase();

  const visible = useMemo(() => {
    if (accounts === undefined || holders === undefined) return undefined;
    return accounts.filter((account) => {
      const holder = holders.get(account.id);
      if (!passesFilter(account, holder, filter)) return false;
      return query === '' || matches(account, holder, query);
    });
  }, [accounts, holders, filter, query]);

  async function runImport(): Promise<void> {
    if (store.getState().importing) return;
    store.setState({ importing: true, importError: null, importSummary: null });

    const result = await importPppoeFromRouter();

    store.setState({
      importing: false,
      importError: result.ok ? null : (result.error ?? 'Import failed.'),
      importSummary: result.ok
        ? `${pluralize(result.secrets, 'account')} and ${pluralize(result.profiles, 'profile')} from the router.`
        : null,
    });
  }

  const nothingAtAll = accounts !== undefined && accounts.length === 0;

  return {
    accounts: visible,
    total: accounts?.length ?? 0,
    search,
    filter,
    editing,
    canEdit: isSuperAdmin,
    online,
    importing,
    importError,
    importSummary,
    emptyTitle: nothingAtAll ? 'No PPPoE accounts yet' : 'No accounts match',
    emptyMessage: nothingAtAll
      ? isSuperAdmin
        ? 'Import the router’s secrets to pull in every line it already has, or tap + to add one.'
        : 'An admin needs to import or add accounts first.'
      : 'Try clearing the search or the filter.',
    holderName: (accountId) => holders?.get(accountId),
    syncState: (accountId) => unsynced.get(accountId),
    setSearch: (value) => store.setState({ search: value }),
    setFilter: (value) => store.setState({ filter: value }),
    edit: (account) => store.setState({ editing: account }),
    create: () => store.setState({ editing: 'new' }),
    closeForm: () => store.setState({ editing: null }),
    importFromRouter: () => void runImport(),
  };
}
