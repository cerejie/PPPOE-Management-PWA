import { daysUntil } from '@/lib/format';

/** Compact "days until expiry" pill with status colouring. */
export function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  const days = daysUntil(expiresAt);

  if (days === null) {
    return <span className="text-xs text-muted">no expiry</span>;
  }

  let cls = 'bg-emerald-50 text-ok';
  let text = `${days}d left`;
  if (days < 0) {
    cls = 'bg-red-50 text-danger';
    text = `expired ${Math.abs(days)}d`;
  } else if (days === 0) {
    cls = 'bg-red-50 text-danger';
    text = 'expires today';
  } else if (days <= 7) {
    cls = 'bg-amber-50 text-warn';
  }

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>
  );
}
