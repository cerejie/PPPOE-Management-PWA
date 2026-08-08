// =============================================================================
// RouterOS binary API client (Deno).
//
// RouterOS v6 has no REST API — `/rest/...` only exists in v7 — so this speaks
// the binary API protocol directly over TCP (service `api` 8728 / `api-ssl`
// 8729). Keep this file transport-only: no Supabase, no domain logic.
//
// Protocol, in brief:
//   * A "word" is a length prefix followed by raw bytes.
//   * A "sentence" is a sequence of words terminated by a zero-length word.
//   * A reply sentence starts with !done / !re / !trap / !fatal, followed by
//     `=key=value` attribute words.
// =============================================================================

export interface RouterOsOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Use api-ssl (8729). Strongly preferred: plain `api` sends the password in clear. */
  tls: boolean;
  /** PEM of the router's self-signed certificate. Required for tls unless it is publicly trusted. */
  caCert?: string;
  /** Per-read timeout in ms. */
  timeoutMs?: number;
}

export interface Sentence {
  /** '!done' | '!re' | '!trap' | '!fatal' */
  reply: string;
  attrs: Record<string, string>;
}

export class RouterOsError extends Error {}

// --- word length codec -------------------------------------------------------

function encodeLength(len: number): Uint8Array {
  if (len < 0x80) return new Uint8Array([len]);
  if (len < 0x4000) {
    const v = (len | 0x8000) >>> 0;
    return new Uint8Array([(v >>> 8) & 0xff, v & 0xff]);
  }
  if (len < 0x200000) {
    const v = (len | 0xc00000) >>> 0;
    return new Uint8Array([(v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]);
  }
  if (len < 0x10000000) {
    const v = (len | 0xe0000000) >>> 0;
    return new Uint8Array([(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]);
  }
  return new Uint8Array([
    0xf0,
    (len >>> 24) & 0xff,
    (len >>> 16) & 0xff,
    (len >>> 8) & 0xff,
    len & 0xff,
  ]);
}

// --- MD5, for the pre-6.43 challenge login -----------------------------------
//
// Web Crypto only offers SHA, and RouterOS < 6.43 authenticates with an MD5
// challenge-response. Inlined rather than pulled from a registry so the
// function has no third-party dependency in its auth path.

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
];

const MD5_K = (() => {
  const k = new Uint32Array(64);
  for (let i = 0; i < 64; i++) k[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
  return k;
})();

function md5(msg: Uint8Array): Uint8Array {
  const padded = new Uint8Array(Math.ceil((msg.length + 1 + 8) / 64) * 64);
  padded.set(msg);
  padded[msg.length] = 0x80;

  const dv = new DataView(padded.buffer);
  const bits = msg.length * 8;
  dv.setUint32(padded.length - 8, bits >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bits / 0x100000000), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let off = 0; off < padded.length; off += 64) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        f = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        f = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      const m = dv.getUint32(off + g * 4, true);
      const tmp = (f + A + MD5_K[i] + m) >>> 0;
      const s = MD5_S[i];
      A = D;
      D = C;
      C = B;
      B = (B + (((tmp << s) | (tmp >>> (32 - s))) >>> 0)) >>> 0;
    }
    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;
  }

  const out = new Uint8Array(16);
  const odv = new DataView(out.buffer);
  odv.setUint32(0, a0, true);
  odv.setUint32(4, b0, true);
  odv.setUint32(8, c0, true);
  odv.setUint32(12, d0, true);
  return out;
}

function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// --- client ------------------------------------------------------------------

const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class RouterOsClient {
  #opts: RouterOsOptions;
  #conn: Deno.Conn | null = null;
  #buf = new Uint8Array(0);

  constructor(opts: RouterOsOptions) {
    this.#opts = opts;
  }

  get #timeout(): number {
    return this.#opts.timeoutMs ?? 10_000;
  }

  async connect(): Promise<void> {
    const { host, port, tls, caCert } = this.#opts;

    this.#conn = tls
      ? await Deno.connectTls({
          hostname: host,
          port,
          // A router's own certificate is self-signed, so it has to be supplied
          // explicitly — Deno has no "skip verification" escape hatch.
          caCerts: caCert ? [caCert] : undefined,
        })
      : await Deno.connect({ hostname: host, port });

    await this.#login();
  }

  close(): void {
    try {
      this.#conn?.close();
    } catch {
      // Already closed by the router; nothing to do.
    }
    this.#conn = null;
  }

  /**
   * Send one sentence and collect replies until !done.
   * Throws RouterOsError on !trap / !fatal.
   */
  async talk(words: string[]): Promise<Sentence[]> {
    await this.#writeSentence(words);

    const records: Sentence[] = [];
    let trap: string | null = null;

    for (;;) {
      const s = await this.#readSentence();
      if (s.reply === '!re') records.push(s);
      else if (s.reply === '!trap') trap = s.attrs.message ?? 'unknown router error';
      else if (s.reply === '!fatal') {
        throw new RouterOsError(s.attrs.message ?? 'router closed the session');
      } else if (s.reply === '!done') {
        if (Object.keys(s.attrs).length > 0) records.push(s);
        break;
      }
    }

    if (trap !== null) throw new RouterOsError(trap);
    return records;
  }

  // --- login ---------------------------------------------------------------

  async #login(): Promise<void> {
    const { user, password } = this.#opts;

    // RouterOS >= 6.43 accepts name+password in the first sentence. Older
    // firmware ignores them and answers with `=ret=<challenge>` instead, which
    // is exactly how we detect it — no version sniffing needed.
    await this.#writeSentence(['/login', `=name=${user}`, `=password=${password}`]);
    const first = await this.#readSentence();

    if (first.reply === '!trap' || first.reply === '!fatal') {
      // Drain the trailing !done so the socket is not left mid-sentence.
      if (first.reply === '!trap') await this.#readSentence().catch(() => undefined);
      throw new RouterOsError(first.attrs.message ?? 'login rejected');
    }

    const challenge = first.attrs.ret;
    if (!challenge) return; // 6.43+ — already authenticated.

    // Legacy: MD5(0x00 || password || challenge), sent as `=response=00<hex>`.
    const pw = encoder.encode(password);
    const chal = fromHex(challenge);
    const material = new Uint8Array(1 + pw.length + chal.length);
    material[0] = 0;
    material.set(pw, 1);
    material.set(chal, 1 + pw.length);

    await this.#writeSentence([
      '/login',
      `=name=${user}`,
      `=response=00${toHex(md5(material))}`,
    ]);

    const second = await this.#readSentence();
    if (second.reply !== '!done') {
      throw new RouterOsError(second.attrs.message ?? 'login rejected');
    }
  }

  // --- framing -------------------------------------------------------------

  async #writeSentence(words: string[]): Promise<void> {
    const conn = this.#conn;
    if (!conn) throw new RouterOsError('not connected');

    const parts: Uint8Array[] = [];
    for (const w of words) {
      const bytes = encoder.encode(w);
      parts.push(encodeLength(bytes.length), bytes);
    }
    parts.push(new Uint8Array([0])); // sentence terminator

    const total = parts.reduce((n, p) => n + p.length, 0);
    const out = new Uint8Array(total);
    let at = 0;
    for (const p of parts) {
      out.set(p, at);
      at += p.length;
    }

    let written = 0;
    while (written < out.length) {
      written += await conn.write(out.subarray(written));
    }
  }

  async #readSentence(): Promise<Sentence> {
    const words: string[] = [];
    for (;;) {
      const len = await this.#readLength();
      if (len === 0) break;
      words.push(decoder.decode(await this.#readExact(len)));
    }

    const attrs: Record<string, string> = {};
    let reply = '';
    for (const w of words) {
      if (w.startsWith('!')) {
        reply = w;
      } else if (w.startsWith('=')) {
        // `=key=value`; the value itself may contain '='.
        const eq = w.indexOf('=', 1);
        if (eq === -1) attrs[w.slice(1)] = '';
        else attrs[w.slice(1, eq)] = w.slice(eq + 1);
      }
    }
    return { reply, attrs };
  }

  async #readLength(): Promise<number> {
    const b0 = (await this.#readExact(1))[0];
    if ((b0 & 0x80) === 0) return b0;
    if ((b0 & 0xc0) === 0x80) {
      const r = await this.#readExact(1);
      return ((b0 & 0x3f) << 8) | r[0];
    }
    if ((b0 & 0xe0) === 0xc0) {
      const r = await this.#readExact(2);
      return ((b0 & 0x1f) << 16) | (r[0] << 8) | r[1];
    }
    if ((b0 & 0xf0) === 0xe0) {
      const r = await this.#readExact(3);
      return ((b0 & 0x0f) << 24) | (r[0] << 16) | (r[1] << 8) | r[2];
    }
    const r = await this.#readExact(4);
    return ((r[0] << 24) | (r[1] << 16) | (r[2] << 8) | r[3]) >>> 0;
  }

  async #readExact(n: number): Promise<Uint8Array> {
    const conn = this.#conn;
    if (!conn) throw new RouterOsError('not connected');

    while (this.#buf.length < n) {
      const chunk = new Uint8Array(8192);
      const got = await this.#withTimeout(conn.read(chunk));
      if (got === null) throw new RouterOsError('router closed the connection');
      const merged = new Uint8Array(this.#buf.length + got);
      merged.set(this.#buf);
      merged.set(chunk.subarray(0, got), this.#buf.length);
      this.#buf = merged;
    }

    const out = new Uint8Array(this.#buf.subarray(0, n));
    this.#buf = this.#buf.subarray(n);
    return out;
  }

  #withTimeout<T>(p: Promise<T>): Promise<T> {
    let timer = 0;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new RouterOsError(
              `router did not respond within ${this.#timeout}ms — check that the API service is reachable`,
            ),
          ),
        this.#timeout,
      );
    });
    return Promise.race([p, timeout]).finally(() => clearTimeout(timer)) as Promise<T>;
  }
}

// --- PPPoE operations --------------------------------------------------------

/** RouterOS booleans come back as the strings 'true' / 'false'. */
const isTrue = (v: string | undefined) => v === 'true' || v === 'yes';

export interface ApplyResult {
  secretFound: boolean;
  secretChanged: boolean;
  profileChanged: boolean;
  sessionsRemoved: number;
}

/** One `/ppp/secret`, as the app mirrors it. */
export interface SecretRow {
  /** RouterOS's internal id, "*1A". */
  id: string;
  name: string;
  password: string;
  service: string;
  profile: string;
  comment: string;
  disabled: boolean;
}

/** One `/ppp/profile`. Read-only — the app never creates these. */
export interface ProfileRow {
  name: string;
  rateLimit: string;
  localAddress: string;
  remoteAddress: string;
}

/** Fields the app is allowed to write onto a secret. */
export interface SecretInput {
  name: string;
  password: string;
  service: string;
  profile?: string | null;
  comment?: string | null;
  disabled: boolean;
}

/**
 * Every secret on the router, disabled ones included.
 *
 * The disabled ones are the point: a line cut off weeks ago still belongs to a
 * subscriber, and an operator who cannot see it cannot bring it back.
 */
export async function listSecrets(client: RouterOsClient): Promise<SecretRow[]> {
  const rows = await client.talk([
    '/ppp/secret/print',
    '=.proplist=.id,name,password,service,profile,comment,disabled',
  ]);

  return rows
    .filter((r) => r.attrs.name && r.attrs['.id'])
    .map((r) => ({
      id: r.attrs['.id'],
      name: r.attrs.name,
      password: r.attrs.password ?? '',
      service: r.attrs.service || 'pppoe',
      profile: r.attrs.profile ?? '',
      comment: r.attrs.comment ?? '',
      disabled: isTrue(r.attrs.disabled),
    }));
}

export async function listProfiles(client: RouterOsClient): Promise<ProfileRow[]> {
  const rows = await client.talk([
    '/ppp/profile/print',
    '=.proplist=name,rate-limit,local-address,remote-address',
  ]);

  return rows
    .filter((r) => r.attrs.name)
    .map((r) => ({
      name: r.attrs.name,
      rateLimit: r.attrs['rate-limit'] ?? '',
      localAddress: r.attrs['local-address'] ?? '',
      remoteAddress: r.attrs['remote-address'] ?? '',
    }));
}

/** `=key=value` words for the fields that are actually set. */
function secretWords(input: SecretInput): string[] {
  const words = [
    `=name=${input.name}`,
    `=password=${input.password}`,
    `=service=${input.service}`,
    `=disabled=${input.disabled ? 'yes' : 'no'}`,
    // Always sent, empty included: the comment is the name of the client on the
    // line, so a line that changes hands has to lose the previous name — an
    // omitted word would leave the old subscriber's name on the secret.
    `=comment=${input.comment ?? ''}`,
  ];
  // Profile is the opposite case, and omitted rather than blanked: an empty
  // profile word would clear the router's own default instead of leaving it
  // alone. Null here means "the plan does not name one".
  if (input.profile) words.push(`=profile=${input.profile}`);
  return words;
}

/**
 * Add a secret unconditionally. Returns the RouterOS id.
 *
 * RouterOS does **not** enforce unique secret names — `/ppp/secret/add` with a
 * name that already exists succeeds and leaves the subscriber with two lines.
 * So this must only be called for a name the caller has just confirmed is
 * absent; `resolveSecret()` in accounts.ts is the one place that decides, from
 * a full `listSecrets()` taken in the same session.
 */
export async function addSecret(client: RouterOsClient, input: SecretInput): Promise<string> {
  const created = await client.talk(['/ppp/secret/add', ...secretWords(input)]);
  const id = created[0]?.attrs.ret;
  if (!id) throw new RouterOsError(`router did not return an id for "${input.name}"`);
  return id;
}

export async function updateSecret(
  client: RouterOsClient,
  secretId: string,
  input: SecretInput,
): Promise<void> {
  await client.talk(['/ppp/secret/set', `=.id=${secretId}`, ...secretWords(input)]);
}

/** Remove a secret and drop the session it may still be holding open. */
export async function removeSecret(
  client: RouterOsClient,
  secretId: string,
  name: string,
): Promise<void> {
  await dropSessions(client, name);
  await client.talk(['/ppp/secret/remove', `=.id=${secretId}`]);
}

/** Kick every live session for `pppoeUsername`. Returns how many were dropped. */
async function dropSessions(client: RouterOsClient, pppoeUsername: string): Promise<number> {
  const active = await client.talk([
    '/ppp/active/print',
    `?name=${pppoeUsername}`,
    '=.proplist=.id,name',
  ]);

  let removed = 0;
  for (const session of active) {
    if (session.attrs.name !== pppoeUsername || !session.attrs['.id']) continue;
    await client.talk(['/ppp/active/remove', `=.id=${session.attrs['.id']}`]);
    removed += 1;
  }
  return removed;
}

/**
 * Force `pppoeUsername` to the desired line state.
 *
 * Disconnect = disable the secret *and* drop any live session: disabling alone
 * leaves the current session up until it happens to re-dial, so the client
 * would stay online for hours after being cut off in the app.
 *
 * Connect = re-enable the secret only. The CPE re-dials on its own; there is no
 * server-side way to raise a PPPoE session for it.
 *
 * Idempotent by construction — it asserts a desired state rather than replaying
 * a log, so a retry after a partial failure is always safe.
 */
export async function applyLineState(
  client: RouterOsClient,
  pppoeUsername: string,
  connected: boolean,
  profile?: string | null,
): Promise<ApplyResult> {
  const secrets = await client.talk([
    '/ppp/secret/print',
    `?name=${pppoeUsername}`,
    '=.proplist=.id,name,disabled,profile',
  ]);

  // `?name=` is a filter, but match exactly: RouterOS returns the row set and
  // we must never disable a different client on a near-miss.
  const secret = secrets.find((s) => s.attrs.name === pppoeUsername);
  if (!secret?.attrs['.id']) {
    return {
      secretFound: false,
      secretChanged: false,
      profileChanged: false,
      sessionsRemoved: 0,
    };
  }

  const shouldBeDisabled = !connected;
  const isDisabled = isTrue(secret.attrs.disabled);

  // The plan's bandwidth profile is asserted here rather than only at creation,
  // so moving a client between plans actually changes their speed. A null
  // profile means the plan does not name one — leave whatever the router has.
  const wantProfile = profile ?? null;
  const profileChanged = wantProfile !== null && secret.attrs.profile !== wantProfile;

  let secretChanged = false;
  if (isDisabled !== shouldBeDisabled || profileChanged) {
    await client.talk([
      '/ppp/secret/set',
      `=.id=${secret.attrs['.id']}`,
      `=disabled=${shouldBeDisabled ? 'yes' : 'no'}`,
      ...(profileChanged ? [`=profile=${wantProfile}`] : []),
    ]);
    secretChanged = isDisabled !== shouldBeDisabled;
  }

  // Disabling alone leaves the current session up until it happens to re-dial,
  // so the subscriber would stay online for hours after being cut off.
  const sessionsRemoved = connected ? 0 : await dropSessions(client, pppoeUsername);

  return { secretFound: true, secretChanged, profileChanged, sessionsRemoved };
}

/** Connectivity/credential check — also reports the firmware version. */
export async function readIdentity(
  client: RouterOsClient,
): Promise<{ version: string; board: string; identity: string }> {
  const res = await client.talk(['/system/resource/print', '=.proplist=version,board-name']);
  const ident = await client.talk(['/system/identity/print', '=.proplist=name']);
  return {
    version: res[0]?.attrs.version ?? 'unknown',
    board: res[0]?.attrs['board-name'] ?? 'unknown',
    identity: ident[0]?.attrs.name ?? 'unknown',
  };
}
