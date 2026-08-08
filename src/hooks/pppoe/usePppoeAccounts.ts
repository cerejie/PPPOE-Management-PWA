import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/api/common/db';
import type { PppoeAccount } from '@/types/pppoe/Pppoe.types';

/** Every live account, name-ordered — the order anyone hunting for a line wants. */
export function usePppoeAccounts(): PppoeAccount[] | undefined {
  return useLiveQuery(
    async () =>
      (await db.pppoe_accounts.toArray())
        .filter((a) => !a.deleted_at)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );
}

export function usePppoeAccount(id: string | undefined): PppoeAccount | undefined {
  return useLiveQuery(
    async () => (id ? await db.pppoe_accounts.get(id) : undefined),
    [id],
  );
}

/**
 * account id -> the full name of the client on it.
 *
 * The assignment lives on `clients`, so this is the one place that inverts it;
 * every screen showing "who is on this line" reads the map rather than
 * re-scanning the client list.
 */
export function usePppoeAccountHolders(): Map<string, string> | undefined {
  return useLiveQuery(async () => {
    const clients = await db.clients.toArray();
    const holders = new Map<string, string>();
    for (const client of clients) {
      if (client.deleted_at || !client.pppoe_account_id) continue;
      holders.set(client.pppoe_account_id, client.full_name);
    }
    return holders;
  }, []);
}
