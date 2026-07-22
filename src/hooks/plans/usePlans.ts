import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import type { Plan } from '@/types/plans/plans.types';

export function usePlans(): Plan[] | undefined {
  return useLiveQuery(
    async () =>
      (await db.plans.toArray())
        .filter((p) => !p.deleted_at)
        .sort((a, b) => a.price - b.price),
    [],
  );
}
