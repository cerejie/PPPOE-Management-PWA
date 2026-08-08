import { daysUntil } from '@/common/utils/Format.utils';
import { caption, pill, type PillTone } from '@/styles/global/Badge.css';

interface Props {
  expiresAt: string | null;
  /** When set, the subscription is frozen and the countdown is not running. */
  pausedAt?: string | null;
}

/** Compact "days until expiry" pill with status colouring. */
export function ExpiryBadge({ expiresAt, pausedAt }: Props) {
  // While paused the stored expiry keeps sliding into the past even though the
  // client owes nothing, so a countdown here would read as overdue. Show the
  // frozen state instead; the remaining days are restored on resume.
  if (pausedAt) {
    return <span className={pill.warn}>paused</span>;
  }

  const days = daysUntil(expiresAt);

  if (days === null) {
    return <span className={caption}>no expiry</span>;
  }

  let tone: PillTone = 'ok';
  let text = `${days}d left`;
  if (days < 0) {
    tone = 'danger';
    text = `expired ${Math.abs(days)}d`;
  } else if (days === 0) {
    tone = 'danger';
    text = 'expires today';
  } else if (days <= 7) {
    tone = 'warn';
  }

  return <span className={pill[tone]}>{text}</span>;
}
