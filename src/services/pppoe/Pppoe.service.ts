import { db } from '@/api/common/db';
import { newUuid } from '@/common/utils/Format.utils';
import { pullAll, queueEntityWrite, settleWrite } from '@/api/sync/syncEngine';
import { importRouterState } from '@/api/sync/routerBridge';
import type { PppoeAccount, RouterImportResult } from '@/types/pppoe/Pppoe.types';

// SuperAdmin CRUD for PPPoE accounts. Every write goes through the outbox, so
// an account can be created, assigned or removed offline; the Edge Function
// then asserts it on the MikroTik on the next sweep.
//
// Two things in here mirror server-side triggers locally, for the same reason
// syncEngine's mirror* functions do — so the UI is correct before anything
// reaches Supabase:
//   * assignment writes clients.pppoe_username alongside pppoe_account_id
//     (trg_clients_pppoe_username)
//   * a rename rewrites it on the assigned client (trg_pppoe_accounts_rename)

export interface PppoeAccountInput {
  name: string;
  password: string;
  service: string;
  /** Only meaningful while unassigned; an assigned line follows its client. */
  disabled: boolean;
  /**
   * Who is on this line. Carried in the same input as the rest of the account
   * so the sheet can create-and-assign in one submit — the caller never has to
   * hold a half-made account's id to finish the job.
   */
  client_id: string | null;
}

/**
 * Trimmed, and nothing else.
 *
 * It used to be lower-cased as well, to spare an operator a stray capital.
 * That was the wrong trade: RouterOS secret names are case-sensitive, so
 * `201-ROOM` and `201-room` are two different lines, and folding the case made
 * the mirror unable to name the secret it stood for. Migration 0010 dropped the
 * matching check on the column.
 */
function normaliseName(name: string): string {
  return name.trim();
}

/**
 * The `/ppp/secret` comment is the name of the client on the line — set here
 * and never typed, so the router's own list reads as who is on what.
 *
 * Local half of desiredStateFor() in the Edge Function, in the same sense as
 * syncEngine's mirror* pairs: the sweep asserts it on the router, this keeps
 * the app right in the meantime and offline.
 */
async function holderComment(clientId: string | null): Promise<string | null> {
  if (!clientId) return null;
  return (await db.clients.get(clientId))?.full_name ?? null;
}

/** Case-insensitive, so two lines that differ only by capitals cannot be made
 * by accident — the router would accept both and an operator could not tell
 * them apart in a list. */
async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const wanted = name.toLowerCase();
  const rows = await db.pppoe_accounts.toArray();
  return rows.some(
    (a) => !a.deleted_at && a.id !== exceptId && a.name.toLowerCase() === wanted,
  );
}

/** The account currently assigned to `clientId`, if any. */
export async function accountForClient(clientId: string): Promise<PppoeAccount | undefined> {
  const client = await db.clients.get(clientId);
  if (!client?.pppoe_account_id) return undefined;
  return db.pppoe_accounts.get(client.pppoe_account_id);
}

/** The client currently holding `accountId`, if any. */
export async function clientIdForAccount(accountId: string): Promise<string | null> {
  const holder = (await db.clients.where('pppoe_account_id').equals(accountId).toArray()).find(
    (c) => !c.deleted_at,
  );
  return holder?.id ?? null;
}

export async function createPppoeAccount(input: PppoeAccountInput): Promise<string | null> {
  const name = normaliseName(input.name);
  if (!name) return 'Enter an account name.';
  if (await nameTaken(name)) return `"${name}" already exists.`;

  const now = new Date().toISOString();
  const account: PppoeAccount = {
    id: newUuid(),
    name,
    password: input.password,
    service: input.service,
    comment: await holderComment(input.client_id),
    disabled: input.disabled,
    // Server column defaults, restated so the local row is complete.
    router_secret_id: null,
    present_on_router: false,
    last_seen_at: null,
    // The whole point: the sweep picks this up and creates the /ppp/secret.
    synced_to_router: false,
    router_error: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  const uuid = await queueEntityWrite({
    table: 'pppoe_accounts',
    op: 'insert',
    row_id: account.id,
    values: account,
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  // Queued after the account, so the flush order satisfies the FK.
  if (input.client_id) {
    const assignError = await assignAccountToClient(input.client_id, account.id);
    if (assignError) return `Account saved, but assigning it failed: ${assignError}`;
  }

  return null;
}

/**
 * Edit an account. Any change to what the router holds clears
 * `synced_to_router`, which is what re-queues it for the next sweep — the same
 * pattern as connection_events.executed_on_router.
 */
export async function updatePppoeAccount(
  id: string,
  input: PppoeAccountInput,
): Promise<string | null> {
  const name = normaliseName(input.name);
  if (!name) return 'Enter an account name.';
  if (await nameTaken(name, id)) return `"${name}" already exists.`;

  const uuid = await queueEntityWrite({
    table: 'pppoe_accounts',
    op: 'update',
    row_id: id,
    values: {
      name,
      password: input.password,
      service: input.service,
      comment: await holderComment(input.client_id),
      disabled: input.disabled,
      synced_to_router: false,
      router_error: null,
      updated_at: new Date().toISOString(),
    },
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  const holderId = await clientIdForAccount(id);

  if (holderId === input.client_id) {
    // Nobody moved. Local half of trg_pppoe_accounts_rename: the holder's
    // mirrored username has to follow the account's new name.
    if (holderId) {
      const holder = await db.clients.get(holderId);
      if (holder && holder.pppoe_username !== name) {
        await db.clients.update(holderId, { pppoe_username: name });
      }
    }
    return null;
  }

  // The line changed hands. Assigning writes the new holder's mirrored username
  // for us; clearing it only has to release the old one.
  const assignError = input.client_id
    ? await assignAccountToClient(input.client_id, id)
    : holderId
      ? await writeClientAssignment(holderId, null)
      : null;

  return assignError && `Account saved, but assigning it failed: ${assignError}`;
}

/**
 * Soft-delete an account, which is what tells the sweep to remove the
 * `/ppp/secret` from the router; the row itself is purged server-side only once
 * that has actually happened.
 *
 * A client still on the line is unassigned first rather than the delete being
 * refused: the operator has already been told who it is in the confirm dialog,
 * and doing it here means the FK's ON DELETE SET NULL is never what discovers
 * the assignment — the same explicit release that changing hands goes through.
 * Ordered so the release is queued ahead of the tombstone: the sweep removes a
 * deleted account's secret before it pushes any live one, so the comment write
 * this queues can never resurrect the line it is clearing.
 */
export async function deletePppoeAccount(id: string): Promise<string | null> {
  const holderId = await clientIdForAccount(id);
  if (holderId) {
    const error = await writeClientAssignment(holderId, null);
    if (error) return error;
  }

  const uuid = await queueEntityWrite({
    table: 'pppoe_accounts',
    op: 'update',
    row_id: id,
    values: { deleted_at: new Date().toISOString() },
  });
  return settleWrite(uuid);
}

/**
 * Point `clientId` at `accountId` (or at nothing), from either side of the
 * relationship — the client form and the account sheet both call this.
 *
 * The assignment lives on the client, so this is a clients write. Any previous
 * holder of the account is unassigned first: the column is UNIQUE server-side,
 * and letting the insert fail on that constraint would surface as a raw
 * Postgres error rather than something an operator can act on.
 */
export async function assignAccountToClient(
  clientId: string,
  accountId: string | null,
): Promise<string | null> {
  const account = accountId ? await db.pppoe_accounts.get(accountId) : undefined;
  if (accountId && !account) return 'That PPPoE account no longer exists.';

  if (accountId) {
    const holderId = await clientIdForAccount(accountId);
    if (holderId && holderId !== clientId) {
      const error = await writeClientAssignment(holderId, null);
      if (error) return error;
    }
  }

  return writeClientAssignment(clientId, account ?? null);
}

/** One clients write, mirroring trg_clients_pppoe_username locally. */
async function writeClientAssignment(
  clientId: string,
  account: PppoeAccount | null,
): Promise<string | null> {
  const released = (await db.clients.get(clientId))?.pppoe_account_id ?? null;

  const uuid = await queueEntityWrite({
    table: 'clients',
    op: 'update',
    row_id: clientId,
    values: {
      pppoe_account_id: account?.id ?? null,
      pppoe_username: account?.name ?? null,
      updated_at: new Date().toISOString(),
    },
  });
  const error = await settleWrite(uuid);
  if (error) return error;

  // The secret carries its client's name, so a line changing hands changes the
  // secret at both ends: the one taken up gets the new name, the one let go
  // loses the old one.
  if (account) {
    const failed = await stampSecretComment(account.id, clientId);
    if (failed) return failed;
  }
  if (released && released !== account?.id) {
    return stampSecretComment(released, null);
  }
  return null;
}

/**
 * Put `clientId`'s name on an account's secret — or clear it, for a line
 * nobody is on — and queue the account for the router.
 *
 * Exported because the clients service writes assignments of its own, and a
 * renamed client makes the comment on their line stale. Clearing
 * `synced_to_router` is the whole point: it is what the sweep looks for,
 * exactly as `connection_events.executed_on_router` works.
 */
export async function stampSecretComment(
  accountId: string,
  clientId: string | null,
): Promise<string | null> {
  const uuid = await queueEntityWrite({
    table: 'pppoe_accounts',
    op: 'update',
    row_id: accountId,
    values: {
      comment: await holderComment(clientId),
      synced_to_router: false,
      router_error: null,
      updated_at: new Date().toISOString(),
    },
  });
  return settleWrite(uuid);
}

/**
 * Pull every secret and profile the router holds, then mirror the result in.
 *
 * Online-only and outside the outbox, like the MikroTik credentials themselves:
 * the browser cannot reach the router, and there is nothing to queue — the next
 * import supersedes this one. The Edge Function writes straight to Supabase, so
 * `pullAll` is what actually puts the new rows on this device.
 */
export async function importPppoeFromRouter(): Promise<RouterImportResult> {
  const result = await importRouterState();
  if (result.ok) await pullAll();
  return result;
}
