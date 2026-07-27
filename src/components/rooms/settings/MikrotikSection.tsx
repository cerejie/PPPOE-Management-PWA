import { useState, type FormEvent } from 'react';
import { connectMikrotik, testMikrotik } from '@/services/rooms/rooms.actions';
import { useMikrotikStatus } from '@/hooks/rooms/useMikrotikStatus';
import { fieldClass, labelClass, secondaryButtonClass } from '@/styles/common/formStyles';
import { formatDateTime } from '@/utils/common/format';

/**
 * Settings → MikroTik: address, username, password, like the MikroTik app.
 *
 * One difference that matters: this is not a per-device login. The browser
 * cannot open a raw socket to the router, so the credentials are stored
 * server-side and every disconnect is pushed by the Edge Function. Signing in
 * here connects *the system*, once, for everyone — which is also what makes a
 * disconnect queued offline still reach the router later.
 */
export function MikrotikSection({ online }: { online: boolean }) {
  const { status, loading, refresh, setStatus } = useMikrotikStatus(online);

  const [editing, setEditing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [address, setAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tls, setTls] = useState(true);
  const [caCert, setCaCert] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const connected = Boolean(status?.configured && status.lastOkAt && !status.lastError);
  const showForm = editing || !status?.configured;

  function beginEdit() {
    setAddress(status?.host ? `${status.host}:${status.port}` : '');
    setUsername(status?.username ?? '');
    setPassword('');
    setTls(status?.tls ?? true);
    setCaCert('');
    setError(null);
    setSuccess(null);
    setEditing(true);
  }

  async function handleConnect(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setSuccess(null);
    setBusy(true);

    const result = await connectMikrotik({ address, username, password, tls, caCert });
    setBusy(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setStatus(result.status);
    setPassword('');
    setCaCert('');
    setEditing(false);
    setSuccess(`Connected to ${result.status?.identity ?? 'the router'}.`);
  }

  async function handleTest() {
    if (busy) return;
    setError(null);
    setSuccess(null);
    setBusy(true);

    const result = await testMikrotik();
    setBusy(false);

    if (result.error) {
      setError(result.error);
      await refresh();
      return;
    }
    if (result.status) setStatus(result.status);
    setSuccess('Router responded.');
  }

  return (
    <section className="mt-4 rounded-3xl bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold tracking-tight text-fg">MikroTik router</h2>
        {status?.configured && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              connected ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'
            }`}
          >
            {connected ? 'connected' : 'not reachable'}
          </span>
        )}
      </div>

      <p className="mb-4 text-xs leading-relaxed text-muted">
        Disconnecting a client here disables their PPPoE secret on the router and drops the live
        session. Credentials are stored on the server, not on this device.
      </p>

      {loading && <p className="py-2 text-sm text-muted">Checking…</p>}

      {!loading && status?.configured && !editing && (
        <dl className="mb-4">
          <Row label="Address" value={`${status.host}:${status.port}`} />
          <Row label="Username" value={status.username ?? '—'} />
          <Row label="Identity" value={status.identity ?? '—'} />
          <Row
            label="RouterOS"
            value={[status.version, status.board].filter(Boolean).join(' · ') || '—'}
          />
          <Row
            label="Last contact"
            value={status.lastOkAt ? formatDateTime(status.lastOkAt) : 'never'}
          />
        </dl>
      )}

      {!loading && status?.lastError && !editing && (
        <p className="mb-4 rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {status.lastError}
        </p>
      )}

      {showForm && !loading && (
        <form onSubmit={handleConnect} className="space-y-3">
          <div>
            <label htmlFor="mt-address" className={labelClass}>
              Address
            </label>
            <input
              id="mt-address"
              type="text"
              inputMode="url"
              placeholder="router.example.com:8729"
              required
              autoCapitalize="none"
              autoCorrect="off"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={fieldClass}
            />
            <p className="mt-1 text-xs text-muted">
              Host, or host:port. Defaults to {tls ? '8729' : '8728'}.
            </p>
          </div>

          <div>
            <label htmlFor="mt-username" className={labelClass}>
              Username
            </label>
            <input
              id="mt-username"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="mt-password" className={labelClass}>
              Password
            </label>
            <input
              id="mt-password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={fieldClass}
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-sm font-medium text-muted underline underline-offset-2"
          >
            {showAdvanced ? 'Hide' : 'Show'} advanced
          </button>

          {showAdvanced && (
            <>
              <label className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  checked={tls}
                  onChange={(e) => setTls(e.target.checked)}
                  className="h-5 w-5 rounded border-line accent-[color:var(--accent)]"
                />
                <span className="text-sm text-fg">
                  Encrypted API (api-ssl)
                  <span className="block text-xs text-muted">
                    Turn off only on a trusted local network — plain API sends the password in
                    clear.
                  </span>
                </span>
              </label>

              <div>
                <label htmlFor="mt-ca" className={labelClass}>
                  CA certificate (PEM)
                </label>
                <textarea
                  id="mt-ca"
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----"
                  value={caCert}
                  onChange={(e) => setCaCert(e.target.value)}
                  className={`${fieldClass} font-mono text-xs`}
                />
                <p className="mt-1 text-xs text-muted">
                  Needed when api-ssl uses a self-signed certificate. Leave blank to keep the one
                  already stored.
                </p>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !online} className={secondaryButtonClass}>
            {busy ? 'Connecting…' : 'Connect'}
          </button>

          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
              className="w-full py-2 text-sm font-medium text-muted"
            >
              Cancel
            </button>
          )}
        </form>
      )}

      {!showForm && !loading && (
        <div className="space-y-3">
          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-2xl bg-ok-soft px-4 py-3 text-sm text-ok">{success}</p>
          )}
          <button
            type="button"
            onClick={handleTest}
            disabled={busy || !online}
            className={secondaryButtonClass}
          >
            {busy ? 'Testing…' : 'Test connection'}
          </button>
          <button
            type="button"
            onClick={beginEdit}
            disabled={!online}
            className="w-full py-2 text-sm font-medium text-muted disabled:opacity-40"
          >
            Change credentials
          </button>
        </div>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-b-0">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="truncate text-right text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}
