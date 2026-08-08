import { Screen } from '@/common/components/layout/Screen';
import { Fab } from '@/common/components/buttons/Fab';
import { SearchInput } from '@/common/components/inputs/SearchInput';
import { EmptyState } from '@/common/components/notices/EmptyState';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { PppoeAccountRow } from '@/components/pppoe/lists/PppoeAccountRow';
import { PppoeAccountFormSheet } from '@/components/pppoe/sheet/PppoeAccountFormSheet';
import { PppoeFilterBar } from '@/components/pppoe/widgets/PppoeFilterBar';
import { PppoeImportBar } from '@/components/pppoe/widgets/PppoeImportBar';
import * as styles from '@/styles/pages/pppoe/PppoeAccountsPage.css';
import { pluralize } from '@/common/utils/Format.utils';
import { usePppoeAccountsPage } from '@/hooks/pppoe/usePppoeAccountsPage';

export function PppoeAccountsPage() {
  const vm = usePppoeAccountsPage();
  const { accounts, editing } = vm;

  return (
    <>
      <Screen title="PPPoE" eyebrow={pluralize(vm.total, 'account')}>
        <div className={styles.search}>
          <SearchInput
            value={vm.search}
            onChange={vm.setSearch}
            placeholder="Search name, client or comment"
            ariaLabel="Search PPPoE accounts"
          />
        </div>

        <PppoeFilterBar filter={vm.filter} onChange={vm.setFilter} />

        {vm.canEdit && <PppoeImportBar vm={vm} />}

        {accounts === undefined ? (
          <LoadingNotice />
        ) : accounts.length === 0 ? (
          <EmptyState icon="🔑" title={vm.emptyTitle} message={vm.emptyMessage} />
        ) : (
          <ul className={styles.list}>
            {accounts.map((account) => (
              <PppoeAccountRow
                key={account.id}
                account={account}
                holderName={vm.holderName(account.id)}
                onEdit={vm.canEdit ? () => vm.edit(account) : null}
                syncState={vm.syncState(account.id)}
              />
            ))}
          </ul>
        )}
      </Screen>

      {vm.canEdit && <Fab onClick={vm.create} label="Add PPPoE account" />}

      {editing === 'new' && <PppoeAccountFormSheet onClose={vm.closeForm} />}
      {editing !== null && editing !== 'new' && (
        <PppoeAccountFormSheet account={editing} onClose={vm.closeForm} />
      )}
    </>
  );
}
