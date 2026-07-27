import { useState, type FormEvent } from 'react';
import { Sheet } from '@/components/common/overlays/Sheet';
import { fieldClass, labelClass, primaryButtonClass } from '@/styles/common/formStyles';
import { useAuth } from '@/store/auth/AuthContext';
import { setPaused } from '@/services/payments/payments.actions';
import { OfflineNotice } from '@/components/common/notices/OfflineNotice';
import { daysUntil, formatDate, formatDateTime, formatDuration } from '@/utils/common/format';
import type { Client } from '@/types/clients/clients.types';

interface Props {
  client: Client;
  onClose: () => void;
}

/**
 * Start or end a vacation pause. Shows the client exactly what they keep (when
 * pausing) or get back (when resuming) before anything is written.
 */
export function PauseSheet({ client, onClose }: Props) {
  const { appUser } = useAuth();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const paused = client.paused_at !== null;
  const remainingDays = daysUntil(client.expires_at);
  const pausedSeconds = paused
    ? Math.max(0, (Date.now() - new Date(client.paused_at as string).getTime()) / 1000)
    : 0;
  const newExpiry = paused
    ? new Date(
        new Date(client.expires_at ?? Date.now()).getTime() + pausedSeconds * 1000,
      ).toISOString()
    : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    await setPaused({
      clientId: client.id,
      paused: !paused,
      performedBy: appUser?.id ?? null,
      note,
    });
    onClose();
  }

  return (
    <Sheet
      title={paused ? 'Resume subscription' : 'Pause subscription'}
      subtitle={client.full_name}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-surface-2 px-4 py-3.5 text-sm">
          {paused ? (
            <>
              <p className="text-muted">
                Paused since{' '}
                <span className="font-semibold text-fg">
                  {formatDateTime(client.paused_at)}
                </span>{' '}
                ({formatDuration(pausedSeconds)}).
              </p>
              <p className="mt-2 text-muted">
                Resuming credits that time back — the new expiry becomes{' '}
                <span className="font-semibold text-fg">{formatDate(newExpiry)}</span>, and the
                line is reconnected.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted">
                {client.expires_at === null ? (
                  'This client has no expiry date, so there is no subscription time to freeze.'
                ) : (
                  <>
                    The remaining{' '}
                    <span className="font-semibold text-fg">
                      {remainingDays !== null && remainingDays >= 0
                        ? `${remainingDays} day${remainingDays === 1 ? '' : 's'}`
                        : 'time'}
                    </span>{' '}
                    (through {formatDate(client.expires_at)}) is frozen and given back in full when
                    they return.
                  </>
                )}
              </p>
              <p className="mt-2 text-muted">
                The line is disconnected while paused. Payments taken during the pause still count
                and extend the frozen expiry.
              </p>
            </>
          )}
        </div>

        <div>
          <label htmlFor="pause-note" className={labelClass}>
            Reason <span className="font-normal text-muted/70">(optional)</span>
          </label>
          <input
            id="pause-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={paused ? 'Back from vacation' : 'On vacation until the 20th'}
            className={fieldClass}
          />
        </div>

        <OfflineNotice />

        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Saving…' : paused ? 'Resume now' : 'Pause now'}
        </button>
      </form>
    </Sheet>
  );
}
