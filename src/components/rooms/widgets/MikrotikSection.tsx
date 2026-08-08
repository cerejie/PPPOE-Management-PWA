import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/pages/rooms/widgets/MikrotikSection.css';
import { useMikrotikSettings } from '@/hooks/rooms/useMikrotikSettings';
import { formatDateTime } from '@/common/utils/Format.utils';
import type { MikrotikStatus } from '@/types/rooms/Rooms.types';

interface Props {
  online: boolean;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryRow}>
      <dt className={styles.summaryLabel}>{label}</dt>
      <dd className={styles.summaryValue}>{value}</dd>
    </div>
  );
}

function StoredConnection({ status }: { status: MikrotikStatus }) {
  return (
    <dl className={styles.summary}>
      <SummaryRow label="Address" value={`${status.host}:${status.port}`} />
      <SummaryRow label="Username" value={status.username ?? '—'} />
      <SummaryRow label="Identity" value={status.identity ?? '—'} />
      <SummaryRow
        label="RouterOS"
        value={[status.version, status.board].filter(Boolean).join(' · ') || '—'}
      />
      <SummaryRow
        label="Last contact"
        value={status.lastOkAt ? formatDateTime(status.lastOkAt) : 'never'}
      />
    </dl>
  );
}

/** Settings → MikroTik: address, username, password, like the MikroTik app. */
export function MikrotikSection({ online }: Props) {
  const vm = useMikrotikSettings(online);
  const { status } = vm;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.heading}>MikroTik router</h2>
        {status?.configured && (
          <span
            className={
              vm.connected ? styles.statusPill.connected : styles.statusPill.unreachable
            }
          >
            {vm.connected ? 'connected' : 'not reachable'}
          </span>
        )}
      </div>

      <p className={styles.intro}>
        Disconnecting a client here disables their PPPoE secret on the router and drops the live
        session. Credentials are stored on the server, not on this device.
      </p>

      {vm.loading && <p className={styles.checking}>Checking…</p>}

      {!vm.loading && status?.configured && !vm.editing && <StoredConnection status={status} />}

      {!vm.loading && status?.lastError && !vm.editing && (
        <p className={styles.storedError}>{status.lastError}</p>
      )}

      {vm.showForm && !vm.loading && (
        <form onSubmit={vm.connect} className={form.stackTight}>
          <div>
            <label htmlFor="mt-address" className={form.label}>
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
              value={vm.address}
              onChange={(e) => vm.setAddress(e.target.value)}
              className={form.field}
            />
            <p className={styles.hint}>Host, or host:port. Defaults to {vm.defaultPort}.</p>
          </div>

          <div>
            <label htmlFor="mt-username" className={form.label}>
              Username
            </label>
            <input
              id="mt-username"
              type="text"
              required
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="off"
              value={vm.username}
              onChange={(e) => vm.setUsername(e.target.value)}
              className={form.field}
            />
          </div>

          <div>
            <label htmlFor="mt-password" className={form.label}>
              Password
            </label>
            <input
              id="mt-password"
              type="password"
              required
              autoComplete="new-password"
              value={vm.password}
              onChange={(e) => vm.setPassword(e.target.value)}
              className={form.field}
            />
          </div>

          <button type="button" onClick={vm.toggleAdvanced} className={styles.advancedToggle}>
            {vm.showAdvanced ? 'Hide' : 'Show'} advanced
          </button>

          {vm.showAdvanced && (
            <>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={vm.tls}
                  onChange={(e) => vm.setTls(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>
                  Encrypted API (api-ssl)
                  <span className={styles.checkboxCaption}>
                    Turn off only on a trusted local network — plain API sends the password in
                    clear.
                  </span>
                </span>
              </label>

              <div>
                <label htmlFor="mt-ca" className={form.label}>
                  CA certificate (PEM)
                </label>
                <textarea
                  id="mt-ca"
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----"
                  value={vm.caCert}
                  onChange={(e) => vm.setCaCert(e.target.value)}
                  className={styles.certField}
                />
                <p className={styles.hint}>
                  Needed when api-ssl uses a self-signed certificate. Leave blank to keep the one
                  already stored.
                </p>
              </div>
            </>
          )}

          {vm.error && (
            <p role="alert" className={styles.message.error}>
              {vm.error}
            </p>
          )}

          <button type="submit" disabled={vm.busy || !online} className={form.button.secondary}>
            {vm.busy ? 'Connecting…' : 'Connect'}
          </button>

          {vm.editing && (
            <button type="button" onClick={vm.cancelEdit} className={styles.textButton}>
              Cancel
            </button>
          )}
        </form>
      )}

      {!vm.showForm && !vm.loading && (
        <div className={form.stackTight}>
          {vm.error && (
            <p role="alert" className={styles.message.error}>
              {vm.error}
            </p>
          )}
          {vm.success && <p className={styles.message.success}>{vm.success}</p>}

          <button
            type="button"
            onClick={vm.test}
            disabled={vm.busy || !online}
            className={form.button.secondary}
          >
            {vm.busy ? 'Testing…' : 'Test connection'}
          </button>
          <button
            type="button"
            onClick={vm.beginEdit}
            disabled={!online}
            className={styles.textButton}
          >
            Change credentials
          </button>
        </div>
      )}
    </section>
  );
}
