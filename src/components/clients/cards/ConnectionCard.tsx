import * as styles from '@/components/clients/cards/ConnectionCard.css';
import { formatDateTime, pluralize } from '@/common/utils/Format.utils';
import type { RouterPushStatus } from '@/hooks/clients/useRouterPush';

interface Props {
  isConnected: boolean;
  isPaused: boolean;
  statusSince: string;
  pendingEventCount: number;
  routerPush: RouterPushStatus | undefined;
  isToggling: boolean;
  onToggle: () => void;
}

/** Live connection state, the manual toggle, and why either may be out of date. */
export function ConnectionCard({
  isConnected,
  isPaused,
  statusSince,
  pendingEventCount,
  routerPush,
  isToggling,
  onToggle,
}: Props) {
  const tone = isConnected ? 'live' : 'idle';
  const hasPendingEvents = pendingEventCount > 0;
  const isUnappliedOnRouter = !hasPendingEvents && routerPush !== undefined && routerPush.unapplied > 0;

  return (
    <section className={styles.card}>
      <div className={styles.row}>
        <div className={styles.status}>
          <div className={styles.statusLine}>
            <span className={styles.dot[tone]} aria-hidden />
            <p className={styles.statusLabel[tone]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          <p className={styles.since}>{`since ${formatDateTime(statusSince)}`}</p>
        </div>

        {/*
          While paused the line is down *because* of the pause, and Resume
          already reconnects it. Offering Connect here would duplicate that
          button — and worse, connecting without resuming leaves the client
          online with a frozen clock, a state Resume can never produce.
        */}
        {isPaused ? (
          <span className={styles.pausedHint}>
            Resume to
            <br />
            reconnect
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggle}
            disabled={isToggling}
            aria-pressed={isConnected}
            className={styles.toggle[isConnected ? 'disconnect' : 'connect']}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>
        )}
      </div>

      {hasPendingEvents && (
        <p className={styles.notice.pending}>
          {`${pluralize(pendingEventCount, 'connection change')} pending sync`}
        </p>
      )}

      {isUnappliedOnRouter && (
        // Synced to Supabase but not yet asserted on the MikroTik — the line
        // may still be up. Retried by the scheduled sweep.
        <p className={styles.notice.unapplied}>
          {`Not applied on the router yet — the line may still be ${isConnected ? 'down' : 'up'}.`}
          {routerPush.error ? ` ${routerPush.error}` : ' Retrying automatically.'}
        </p>
      )}
    </section>
  );
}
