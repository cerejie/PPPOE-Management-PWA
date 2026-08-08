import { Link } from 'react-router-dom';
import { Screen } from '@/common/components/layout/Screen';
import { Fab } from '@/common/components/buttons/Fab';
import { EmptyState } from '@/common/components/notices/EmptyState';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { StatCard } from '@/components/dashboard/cards/StatCard';
import { RevenueHero } from '@/components/dashboard/widgets/RevenueHero';
import { ExpiringClientRow } from '@/components/dashboard/lists/ExpiringClientRow';
import { RecordPaymentSheet } from '@/components/payments/sheet/RecordPaymentSheet';
import * as styles from '@/pages/DashboardPage.css';
import {
  DASHBOARD_STAT_CARDS,
  PAUSED_CLIENTS_PATH,
} from '@/constants/dashboard/DashboardStats.constants';
import {
  CLIENTS_PATH,
  NEW_CLIENT_PATH,
  clientDetailPath,
} from '@/constants/clients/ClientRoutes.constants';
import { useDashboardPage } from '@/hooks/dashboard/useDashboardPage';

export function DashboardPage() {
  const vm = useDashboardPage();
  const { stats } = vm;

  return (
    <>
      <Screen title={vm.greeting} eyebrow="Welcome back">
        {stats === undefined ? (
          <LoadingNotice />
        ) : (
          <>
            <RevenueHero
              monthlyRevenue={stats.monthlyRevenue}
              totalClients={stats.total}
              connectedCount={stats.connected}
              pausedCount={stats.paused}
              pausedTo={PAUSED_CLIENTS_PATH}
              addClientTo={vm.canAddClient ? NEW_CLIENT_PATH : null}
            />

            <div className={styles.statGrid}>
              {DASHBOARD_STAT_CARDS.map((card) => (
                <StatCard
                  key={card.label}
                  label={card.label}
                  value={card.countOf(stats)}
                  tone={card.tone}
                  to={card.to}
                />
              ))}
            </div>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Soonest expirations</h2>
              <Link to={CLIENTS_PATH} className={styles.sectionLink}>
                See all
              </Link>
            </div>

            {stats.soonest.length === 0 ? (
              <EmptyState
                icon="📅"
                title="Nothing expiring"
                message="No client has an upcoming expiry date."
              />
            ) : (
              <ul className={styles.list}>
                {stats.soonest.map((client) => (
                  <ExpiringClientRow
                    key={client.id}
                    client={client}
                    to={clientDetailPath(client.id)}
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </Screen>

      <Fab onClick={vm.openPaymentSheet} label="Record payment" />

      {vm.isPaymentSheetOpen && <RecordPaymentSheet onClose={vm.closePaymentSheet} />}
    </>
  );
}
