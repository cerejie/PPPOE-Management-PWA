import { Screen } from '@/common/components/layout/Screen';
import { Fab } from '@/common/components/buttons/Fab';
import { EmptyState } from '@/common/components/notices/EmptyState';
import { LoadingNotice } from '@/common/components/notices/LoadingNotice';
import { PlanCard } from '@/components/plans/cards/PlanCard';
import { PlanFormSheet } from '@/components/plans/sheet/PlanFormSheet';
import * as styles from '@/pages/PlansPage.css';
import { usePlansPage } from '@/hooks/plans/usePlansPage';

export function PlansPage() {
  const vm = usePlansPage();
  const { plans, editing } = vm;

  return (
    <>
      <Screen title="Plans" eyebrow={plans ? `${plans.length} total` : undefined}>
        {plans === undefined ? (
          <LoadingNotice />
        ) : plans.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title="No plans yet"
            message={
              vm.canEdit ? 'Tap + to create your first plan.' : 'An admin needs to add plans first.'
            }
          />
        ) : (
          <ul className={styles.list}>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                clientCount={vm.clientCount(plan.id)}
                onEdit={vm.canEdit ? () => vm.edit(plan) : null}
                syncState={vm.syncState(plan.id)}
              />
            ))}
          </ul>
        )}
      </Screen>

      {vm.canEdit && <Fab onClick={vm.create} label="Add plan" />}

      {editing === 'new' && <PlanFormSheet onClose={vm.closeForm} />}
      {editing !== null && editing !== 'new' && (
        <PlanFormSheet plan={editing} onClose={vm.closeForm} />
      )}
    </>
  );
}
