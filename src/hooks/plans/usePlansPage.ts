import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import { useAuth } from '@/stores/auth/Auth.store';
import { usePlans } from '@/hooks/plans/usePlans';
import { usePlanClientCounts } from '@/hooks/plans/usePlanClientCounts';
import { useEntitySync } from '@/hooks/sync/useEntitySync';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { Plan } from '@/types/plans/Plans.types';

/** Which plan the form sheet is open for; 'new' for a blank one. */
export type PlanEditTarget = Plan | 'new' | null;

interface PlansPageState {
  editing: PlanEditTarget;
}

export interface PlansPageViewModel {
  readonly plans: readonly Plan[] | undefined;
  readonly canEdit: boolean;
  readonly editing: PlanEditTarget;
  clientCount: (planId: string) => number;
  syncState: (planId: string) => EntityWriteState | undefined;
  edit: (plan: Plan) => void;
  create: () => void;
  closeForm: () => void;
}

export function usePlansPage(): PlansPageViewModel {
  const plans = usePlans();
  const counts = usePlanClientCounts();
  const { isSuperAdmin } = useAuth();
  const unsynced = useEntitySync('plans');

  const store = useInstanceStore<PlansPageState>(() => ({ editing: null }));
  const editing = useStore(store, (s) => s.editing);

  return {
    plans,
    canEdit: isSuperAdmin,
    editing,
    clientCount: (planId) => counts?.[planId] ?? 0,
    syncState: (planId) => unsynced.get(planId),
    edit: (plan) => store.setState({ editing: plan }),
    create: () => store.setState({ editing: 'new' }),
    closeForm: () => store.setState({ editing: null }),
  };
}
