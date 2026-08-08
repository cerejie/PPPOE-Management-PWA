import { useNavigate } from 'react-router-dom';
import { Screen } from '@/common/components/layout/Screen';
import { Fab } from '@/common/components/buttons/Fab';
import { FilterChip } from '@/common/components/buttons/FilterChip';
import { SearchInput } from '@/common/components/inputs/SearchInput';
import { EmptyState } from '@/common/components/notices/EmptyState';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { ClientSortButton } from '@/components/clients/buttons/ClientSortButton';
import { ClientListItem } from '@/components/clients/lists/ClientListItem';
import * as styles from '@/styles/pages/clients/ClientsPage.css';
import { CLIENT_FILTER_CHIPS } from '@/constants/clients/ClientFilters.constants';
import { NEW_CLIENT_PATH, clientDetailPath } from '@/constants/clients/ClientRoutes.constants';
import { useClientsPage } from '@/hooks/clients/useClientsPage';

export function ClientsPage() {
  const vm = useClientsPage();
  const navigate = useNavigate();
  const { clients } = vm;

  return (
    <>
      <Screen title="Clients" eyebrow={clients ? `${clients.length} shown` : undefined}>
        <div className={styles.searchRow}>
          <div className={styles.searchField}>
            <SearchInput
              value={vm.search}
              onChange={vm.setSearch}
              placeholder="Search name or PPPoE username"
              ariaLabel="Search clients"
            />
          </div>
          <ClientSortButton sort={vm.sort} onToggle={vm.toggleSort} />
        </div>

        <div className={styles.filterBar}>
          {CLIENT_FILTER_CHIPS.map((chip) => (
            <FilterChip
              key={chip.label}
              active={vm.isChipActive(chip)}
              onClick={() => vm.toggleChip(chip)}
            >
              {chip.label}
            </FilterChip>
          ))}
        </div>

        {vm.roomName && (
          <div className={styles.roomBanner}>
            <span className={styles.roomBannerLabel}>{`Room: ${vm.roomName}`}</span>
            <button type="button" onClick={vm.clearRoom} className={styles.roomBannerClear}>
              Clear
            </button>
          </div>
        )}

        {clients === undefined ? (
          <LoadingNotice />
        ) : clients.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No clients match"
            message="Try clearing the filters or the search."
          />
        ) : (
          <ul className={styles.list}>
            {clients.map((client) => (
              <ClientListItem
                key={client.id}
                client={client}
                roomName={vm.roomNameOf(client.room_id)}
                syncState={vm.syncState(client.id)}
                to={clientDetailPath(client.id)}
              />
            ))}
          </ul>
        )}
      </Screen>

      {vm.canAddClient && <Fab onClick={() => navigate(NEW_CLIENT_PATH)} label="Add client" />}
    </>
  );
}
