import { daysUntil } from '@/lib/format';

/** Compact "days until expiry" pill with status colouring. */
export function ExpiryBadge({ expiresAt }: { expiresAt: string | null }) {
  const days = daysUntil(expiresAt);

  if (days === null) {
    return <span className="shrink-0 text-xs text-muted">no expiry</span>;
  }

  let cls = 'bg-ok-soft text-ok';
  let text = `${days}d left`;
  if (days < 0) {
    cls = 'bg-danger-soft text-danger';
    text = `expired ${Math.abs(days)}d`;
  } else if (days === 0) {
    cls = 'bg-danger-soft text-danger';
    text = 'expires today';
  } else if (days <= 7) {
    cls = 'bg-warn-soft text-warn';
  }

  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}>
      {text}
    </span>
  );
}
