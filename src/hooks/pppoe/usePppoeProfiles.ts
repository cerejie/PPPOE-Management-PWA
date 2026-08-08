import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import type { PppoeProfile } from '@/types/pppoe/Pppoe.types';

/**
 * The router's `/ppp/profile` list, name-ordered. Read-only everywhere in the
 * app: only an import writes it, and a plan points at one by name.
 */
export function usePppoeProfiles(): PppoeProfile[] | undefined {
  return useLiveQuery(
    async () => (await db.pppoe_profiles.toArray()).sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
}
