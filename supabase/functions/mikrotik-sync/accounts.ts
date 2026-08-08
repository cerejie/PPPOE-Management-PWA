// =============================================================================
// PPPoE account reconciliation.
//
// Two directions, deliberately separated:
//
//   importRouterState()  router -> database. Every /ppp/secret and /ppp/profile
//                        the MikroTik holds, enabled or disabled, becomes a row.
//                        The router owns this list.
//
//   reconcileAccounts()  database -> router. Rows the app created, edited or
//                        deleted while the router was out of reach are pushed,
//                        flagged by synced_to_router = false / deleted_at.
//
// Split out of index.ts because it is the only part that speaks both languages;
// index.ts stays a request router.
// =============================================================================

import { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import {
  addSecret,
  listProfiles,
  listSecrets,
  removeSecret,
  RouterOsClient,
  updateSecret,
  type SecretInput,
  type SecretRow,
} from './routeros.ts';

const ACCOUNTS_TABLE = 'pppoe_accounts';
const PROFILES_TABLE = 'pppoe_profiles';

/** Accounts pushed per invocation, so one sweep cannot outrun the wall clock. */
const PUSH_LIMIT = 200;

export interface AccountRow {
  id: string;
  name: string;
  password: string;
  service: string;
  comment: string | null;
  disabled: boolean;
  router_secret_id: string | null;
  present_on_router: boolean;
  synced_to_router: boolean;
  deleted_at: string | null;
}

/** What the app wants a line to be, once its client is taken into account. */
interface DesiredState {
  disabled: boolean;
  profile: string | null;
  /**
   * The secret's comment is the name of the client on the line — the app owns
   * it, so it is asserted rather than preserved, and an unassigned line carries
   * no comment at all.
   */
  comment: string;
}

// --- identifying the secret an account is ------------------------------------
//
// Every push and every removal starts here, and nothing else may decide it.
//
// `router_secret_id` / `present_on_router` are a *cache* of what the router held
// last time, and a cache is not evidence: a row backfilled by migration 0009 has
// neither, an import that failed leaves them stale, and a row created while the
// router was unreachable has no id yet. Branching on them sent an ordinary
// password edit down the create path, and since RouterOS permits duplicate
// secret names, `/ppp/secret/add` happily made a second line for the subscriber.
//
// So the router's own list decides. One `/ppp/secret/print` per sweep is indexed
// both ways an account can point at a secret, and `add` happens only when that
// list genuinely has nothing.

/** The router's live secret list, indexed the three ways an account reaches one. */
interface SecretIndex {
  byId: Map<string, SecretRow>;
  /** Keyed on the name exactly as the router spells it. */
  byName: Map<string, SecretRow>;
  /** Keyed on lower(name) — the healing path only; see resolveSecret(). */
  byLowerName: Map<string, SecretRow>;
}

function indexSecrets(secrets: SecretRow[]): SecretIndex {
  const index: SecretIndex = { byId: new Map(), byName: new Map(), byLowerName: new Map() };
  for (const secret of secrets) remember(index, secret);
  return index;
}

/**
 * The secret this account *is*, or undefined if the router has none.
 *
 * Three keys, in falling order of certainty:
 *
 *   1. the cached RouterOS id, which survives a rename made in the app;
 *   2. the name exactly as both sides spell it — the normal case since 0010,
 *      where the mirror holds the router's own casing;
 *   3. the name ignoring case, which is a *healing* path, not identity. It
 *      reaches the rows migration 0009 lower-cased (`201-room` for a secret the
 *      router calls `201-ROOM`) and gives them back their id. Without it those
 *      rows resolved to nothing and every edit added a duplicate secret.
 *
 * Only step 3 is ambiguous, and only if the router genuinely holds two secrets
 * differing by case; step 2 runs first, so each of them still finds its own.
 *
 * One case is still not resolvable: an account renamed in the app *before* its
 * id was ever recorded (a 0009 backfill row never imported or pushed). Neither
 * key can reach the secret then, so it is added under the new name and the old
 * one is left behind. Import gives every row an id, which is what makes a later
 * rename resolvable.
 */
function resolveSecret(account: AccountRow, index: SecretIndex): SecretRow | undefined {
  const cached = account.router_secret_id ? index.byId.get(account.router_secret_id) : undefined;
  return (
    cached ?? index.byName.get(account.name) ?? index.byLowerName.get(account.name.toLowerCase())
  );
}

// The index is taken once and then kept true for the rest of the pass, because
// one pass can both free a name and claim it: deleting "juan01" and adding a new
// account with the same name is a normal way to re-issue a line. Without these
// two, the add would resolve onto the secret the removal had just destroyed.

function remember(index: SecretIndex, secret: SecretRow): void {
  index.byId.set(secret.id, secret);
  index.byName.set(secret.name, secret);
  // First wins: RouterOS allows two secrets to share a name, and the older is
  // the one the subscriber has been dialling.
  const lower = secret.name.toLowerCase();
  if (!index.byLowerName.has(lower)) index.byLowerName.set(lower, secret);
}

function forget(index: SecretIndex, secret: SecretRow): void {
  index.byId.delete(secret.id);
  if (index.byName.get(secret.name)?.id === secret.id) index.byName.delete(secret.name);
  const lower = secret.name.toLowerCase();
  if (index.byLowerName.get(lower)?.id === secret.id) index.byLowerName.delete(lower);
}

/** What the router now holds, as far as this pass is concerned. */
function asSecretRow(id: string, input: SecretInput): SecretRow {
  return {
    id,
    name: input.name,
    password: input.password,
    service: input.service,
    profile: input.profile ?? '',
    comment: input.comment ?? '',
    disabled: input.disabled,
  };
}

// --- desired state -----------------------------------------------------------

/**
 * Resolve, for each account, whether it should be up, on which profile, and
 * whose name goes on it.
 *
 * An account with a client on it follows that client: their connection_status
 * (which payments, disconnects and the expiry sweep already own) decides the
 * line, their plan's profile decides the bandwidth, and their name is the
 * comment — the one thing that makes a `/ppp/secret` list readable on the
 * router itself. An account with nobody on it keeps whatever the operator set
 * on the row, and carries no comment: there is no client for it to name.
 */
export async function desiredStateFor(
  admin: SupabaseClient,
  accounts: AccountRow[],
): Promise<Map<string, DesiredState>> {
  const desired = new Map<string, DesiredState>(
    accounts.map((a) => [a.id, { disabled: a.disabled, profile: null, comment: '' }]),
  );
  if (accounts.length === 0) return desired;

  const { data: clients } = await admin
    .from('clients')
    .select('pppoe_account_id, plan_id, connection_status, full_name')
    .in('pppoe_account_id', accounts.map((a) => a.id))
    .is('deleted_at', null);

  const holders = (clients ?? []) as Array<{
    pppoe_account_id: string;
    plan_id: string | null;
    connection_status: 'connected' | 'disconnected';
    full_name: string;
  }>;
  if (holders.length === 0) return desired;

  const planIds = [...new Set(holders.map((h) => h.plan_id).filter((id): id is string => !!id))];
  const profileByPlan = await profilesByPlan(admin, planIds);

  for (const holder of holders) {
    desired.set(holder.pppoe_account_id, {
      disabled: holder.connection_status !== 'connected',
      profile: holder.plan_id ? (profileByPlan.get(holder.plan_id) ?? null) : null,
      comment: holder.full_name,
    });
  }

  return desired;
}

/** plan id -> RouterOS profile name, for the plans that name one. */
export async function profilesByPlan(
  admin: SupabaseClient,
  planIds: string[],
): Promise<Map<string, string>> {
  const byPlan = new Map<string, string>();
  if (planIds.length === 0) return byPlan;

  const { data } = await admin.from('plans').select('id, profile').in('id', planIds);

  for (const plan of (data ?? []) as Array<{ id: string; profile: string | null }>) {
    if (plan.profile) byPlan.set(plan.id, plan.profile);
  }
  return byPlan;
}

// --- router -> database ------------------------------------------------------

export interface ImportResult {
  secrets: number;
  profiles: number;
}

/**
 * Mirror the router's secret and profile lists into the database.
 *
 * A row the app has not pushed yet (synced_to_router = false) keeps its local
 * values: the router has not been told about it, so it cannot be evidence
 * against it. Everything else is overwritten from the router, which is the
 * source of truth for what a line actually is.
 */
export async function importRouterState(
  admin: SupabaseClient,
  router: RouterOsClient,
): Promise<ImportResult> {
  // Sequential, not Promise.all: RouterOsClient is one TCP session with one
  // read buffer and sends no `.tag` word, so two commands in flight together
  // cannot have their replies told apart — the readers would split each
  // other's words and desynchronise the framing.
  const secrets = await listSecrets(router);
  const profiles = await listProfiles(router);

  // Every RouterOS ships `default` and `default-encryption`, so an empty
  // profile list is never the router's actual state — it means the read failed
  // silently. Refuse it: mirroring would delete the profile table and flag
  // every account as missing from a box that is fine.
  if (profiles.length === 0) {
    throw new Error(
      'The router returned no PPP profiles, which cannot be true of a live RouterOS. Treating this as a failed read rather than wiping the mirrored lists.',
    );
  }

  const seenAt = new Date().toISOString();

  await mirrorProfiles(admin, profiles, seenAt);
  await mirrorSecrets(admin, secrets, seenAt);

  return { secrets: secrets.length, profiles: profiles.length };
}

async function mirrorProfiles(
  admin: SupabaseClient,
  profiles: Awaited<ReturnType<typeof listProfiles>>,
  seenAt: string,
): Promise<void> {
  const { data: existing } = await admin.from(PROFILES_TABLE).select('id, name');
  const idByName = new Map(
    ((existing ?? []) as Array<{ id: string; name: string }>).map((p) => [p.name, p.id]),
  );

  for (const profile of profiles) {
    const values = {
      name: profile.name,
      rate_limit: profile.rateLimit || null,
      local_address: profile.localAddress || null,
      remote_address: profile.remoteAddress || null,
      last_seen_at: seenAt,
    };
    const id = idByName.get(profile.name);
    if (id) await admin.from(PROFILES_TABLE).update(values).eq('id', id);
    else await admin.from(PROFILES_TABLE).insert(values);
  }

  // A profile gone from the router is gone: nothing references these rows by
  // id (a plan stores the name), so removing them is what makes a plan pointing
  // at a deleted profile show up as broken instead of silently fine.
  const live = new Set(profiles.map((p) => p.name));
  const stale = [...idByName.entries()].filter(([name]) => !live.has(name)).map(([, id]) => id);
  if (stale.length > 0) await admin.from(PROFILES_TABLE).delete().in('id', stale);
}

async function mirrorSecrets(
  admin: SupabaseClient,
  secrets: SecretRow[],
  seenAt: string,
): Promise<void> {
  const { data: existing } = await admin
    .from(ACCOUNTS_TABLE)
    .select('id, name, synced_to_router')
    .is('deleted_at', null);

  const rows = (existing ?? []) as Array<{ id: string; name: string; synced_to_router: boolean }>;
  // Exact spelling first, then ignoring case — the same order and the same
  // reason as resolveSecret(). Matching only exactly left every row that
  // migration 0009 lower-cased unmatched, and the insert below then failed 0009's
  // own `name = lower(name)` check, silently: the secret never appeared in the
  // app at all, and its row never got the router id that stops a later edit
  // from adding a duplicate.
  const byName = new Map(rows.map((r) => [r.name, r]));
  const byLowerName = new Map(rows.map((r) => [r.name.toLowerCase(), r]));

  for (const secret of secrets) {
    const row = byName.get(secret.name) ?? byLowerName.get(secret.name.toLowerCase());

    if (!row) {
      await admin.from(ACCOUNTS_TABLE).insert({
        // Verbatim, since 0010 dropped the lower-case check: `201-ROOM` and
        // `201-room` are different lines to RouterOS, so a mirror that cannot
        // tell them apart is not a mirror.
        name: secret.name,
        password: secret.password,
        service: secret.service,
        comment: secret.comment || null,
        disabled: secret.disabled,
        router_secret_id: secret.id,
        present_on_router: true,
        last_seen_at: seenAt,
        synced_to_router: true,
        router_error: null,
      });
      continue;
    }

    // An unpushed local edit is not overwritten — only stamped as present, so
    // the next reconcile pushes it onto the secret we just found.
    const values = row.synced_to_router
      ? {
          // Import is the one direction in which casing may change, and it is
          // the safe one: it corrects the app to match the router rather than
          // renaming a line the CPE is dialling. trg_pppoe_accounts_rename
          // carries it on to clients.pppoe_username.
          name: secret.name,
          password: secret.password,
          service: secret.service,
          comment: secret.comment || null,
          disabled: secret.disabled,
          router_secret_id: secret.id,
          present_on_router: true,
          last_seen_at: seenAt,
        }
      : { router_secret_id: secret.id, present_on_router: true, last_seen_at: seenAt };

    await admin.from(ACCOUNTS_TABLE).update(values).eq('id', row.id);
  }

  const live = new Set(secrets.map((s) => s.name.toLowerCase()));
  const missing = rows.filter((r) => !live.has(r.name.toLowerCase())).map((r) => r.id);
  if (missing.length > 0) {
    await admin.from(ACCOUNTS_TABLE).update({ present_on_router: false }).in('id', missing);
  }
}

// --- database -> router ------------------------------------------------------

export interface ReconcileResult {
  created: number;
  updated: number;
  removed: number;
  /**
   * Deleted accounts whose secret the router did not have. Normal (removed by
   * hand, or never pushed), but reported because it is the one outcome with no
   * trace left anywhere else: the tombstone is purged either way.
   */
  missing: number;
  errors: Array<{ name: string; error: string }>;
}

/**
 * Push everything the app owes the router: accounts created or edited offline,
 * and accounts deleted in the app whose secret is still on the box.
 *
 * A failure is recorded on the row and left unsynced, so the next sweep retries
 * it — the same contract connection_events.executed_on_router has.
 */
export async function reconcileAccounts(
  admin: SupabaseClient,
  router: RouterOsClient,
): Promise<ReconcileResult> {
  const result: ReconcileResult = { created: 0, updated: 0, removed: 0, missing: 0, errors: [] };

  // One print for the whole pass, before anything is written: what the router
  // holds right now is the only thing allowed to decide add-vs-set and
  // remove-vs-skip. Taken once rather than per account so a sweep of 200 rows
  // is one round trip, not 200.
  const index = indexSecrets(await listSecrets(router));

  await removeDeleted(admin, router, index, result);
  await pushUnsynced(admin, router, index, result);

  return result;
}

/** lower(name) of every account still alive, so a tombstone cannot claim one. */
async function liveNames(admin: SupabaseClient): Promise<Set<string>> {
  const { data } = await admin.from(ACCOUNTS_TABLE).select('name').is('deleted_at', null);
  return new Set(((data ?? []) as Array<{ name: string }>).map((r) => r.name.toLowerCase()));
}

/**
 * The secret a deleted account stands for, or undefined if the router has none.
 *
 * The same three keys as resolveSecret(), and it has to be: the removal path
 * used to look the exact-cased `byName` map up with a lower-cased key, so any
 * secret carrying a capital — every mixed-case line since 0010 made the mirror
 * hold the router's own spelling — resolved to nothing and its `/ppp/secret`
 * was left on the box while the row was purged from under it.
 *
 * The one difference from resolveSecret() is `claimed`: the live-name index only
 * frees a name once the row is gone, so a deleted account's name can already
 * belong to a new account. Resolving a tombstone by name would then delete the
 * *new* subscriber's secret — but the cached id still identifies the old one, so
 * only the name keys are gated.
 */
function resolveTombstone(
  account: AccountRow,
  index: SecretIndex,
  claimed: Set<string>,
): SecretRow | undefined {
  const cached = account.router_secret_id ? index.byId.get(account.router_secret_id) : undefined;
  if (cached) return cached;

  const lower = account.name.toLowerCase();
  if (claimed.has(lower)) return undefined;

  return index.byName.get(account.name) ?? index.byLowerName.get(lower);
}

async function removeDeleted(
  admin: SupabaseClient,
  router: RouterOsClient,
  index: SecretIndex,
  result: ReconcileResult,
): Promise<void> {
  const { data } = await admin
    .from(ACCOUNTS_TABLE)
    .select('*')
    .not('deleted_at', 'is', null)
    .limit(PUSH_LIMIT);

  const tombstones = (data ?? []) as AccountRow[];
  if (tombstones.length === 0) return;

  const claimed = await liveNames(admin);

  for (const account of tombstones) {
    try {
      // Resolved from the live list rather than present_on_router: a stale flag
      // used to hard-delete the row while leaving its secret on the router
      // forever, with nothing left in the app pointing at it.
      const secret = resolveTombstone(account, index, claimed);

      if (secret) {
        await removeSecret(router, secret.id, secret.name);
        forget(index, secret);
        result.removed += 1;
      } else {
        // Nothing to remove: already gone from the router, or the name has been
        // re-issued to a live account that now owns the secret. Counted rather
        // than passed over in silence, because before resolveTombstone() this
        // branch was also where a failed lookup landed, and an orphaned secret
        // is invisible from the app once the row is purged.
        result.missing += 1;
      }
      // The tombstone existed only to carry the delete this far.
      await admin.from(ACCOUNTS_TABLE).delete().eq('id', account.id);
    } catch (err) {
      const error = (err as Error).message;
      await admin.from(ACCOUNTS_TABLE).update({ router_error: error }).eq('id', account.id);
      result.errors.push({ name: account.name, error });
    }
  }
}

async function pushUnsynced(
  admin: SupabaseClient,
  router: RouterOsClient,
  index: SecretIndex,
  result: ReconcileResult,
): Promise<void> {
  const { data } = await admin
    .from(ACCOUNTS_TABLE)
    .select('*')
    .eq('synced_to_router', false)
    .is('deleted_at', null)
    .limit(PUSH_LIMIT);

  const accounts = (data ?? []) as AccountRow[];
  if (accounts.length === 0) return;

  const desired = await desiredStateFor(admin, accounts);

  for (const account of accounts) {
    const want = desired.get(account.id);
    const secret = resolveSecret(account, index);

    const input: SecretInput = {
      // A case-only difference is not a rename, even now that the mirror can
      // hold either spelling: a row still lower-cased by migration 0009 would
      // otherwise rename `201-ROOM` to `201-room` on its first push, and the
      // subscriber's CPE dials the name the router holds. Import is what
      // reconciles the casing (mirrorSecrets), in the direction that is safe.
      // A rename of any other kind still goes through.
      name:
        secret && secret.name.toLowerCase() === account.name.toLowerCase()
          ? secret.name
          : account.name,
      // An empty password is never a thing anyone means: it is what migration
      // 0009 backfilled rows carry, because the password only ever lived on the
      // router. Pushing it would blank a working line, so the router's own
      // password stands and is mirrored back below.
      password: account.password || (secret?.password ?? ''),
      service: account.service,
      profile: want?.profile ?? null,
      // Asserted from the holder, never from the row: the comment is what the
      // client is called, and it is no longer an editable field anywhere.
      comment: want?.comment ?? '',
      disabled: want?.disabled ?? account.disabled,
    };

    try {
      let secretId: string;
      if (secret) {
        // Editing a password, a comment or the name only ever sets the secret
        // that already exists — never adds a second one.
        await updateSecret(router, secret.id, input);
        forget(index, secret);
        secretId = secret.id;
        result.updated += 1;
      } else {
        secretId = await addSecret(router, input);
        result.created += 1;
      }
      remember(index, asSecretRow(secretId, input));

      await admin
        .from(ACCOUNTS_TABLE)
        .update({
          router_secret_id: secretId,
          present_on_router: true,
          synced_to_router: true,
          router_error: null,
          last_seen_at: new Date().toISOString(),
          // The row now reflects what is actually on the router — including a
          // password this push adopted rather than set, and the holder's name
          // as the comment.
          disabled: input.disabled,
          password: input.password,
          comment: input.comment || null,
        })
        .eq('id', account.id);
    } catch (err) {
      const error = (err as Error).message;
      await admin.from(ACCOUNTS_TABLE).update({ router_error: error }).eq('id', account.id);
      result.errors.push({ name: account.name, error });
    }
  }
}
