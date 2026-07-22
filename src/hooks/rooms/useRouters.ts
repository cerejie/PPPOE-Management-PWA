import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import type { Router } from '@/types/rooms/rooms.types';

export function useRouters(): Router[] | undefined {
  return useLiveQuery(async () => {
    const routers = await db.routers.toArray();
    return routers.filter((r) => !r.deleted_at);
  }, []);
}
