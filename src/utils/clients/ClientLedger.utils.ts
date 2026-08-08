import type { LedgerEntry } from '@/hooks/clients/useClientLedger';

/**
 * What deleting this particular row will do to the client. Each kind reverses
 * differently, and the operator is about to change derived state — so the
 * confirm has to say which reversal they are getting.
 */
export function describeLedgerDeletion(entry: LedgerEntry): string {
  if (entry.pending || entry.failed) {
    return 'This has not reached the server yet, so it is dropped from the queue and its effect on this client is undone.';
  }
  if (entry.kind === 'payment') {
    return entry.amount !== null && entry.amount > 0
      ? 'The expiry date moves back by exactly the time this payment bought, and the amount leaves the total paid.'
      : 'A correction never moved the expiry date, so only the row is removed.';
  }
  if (entry.kind === 'pause') {
    return 'Deleting a resume takes the credited time back off the expiry date and re-opens the pause. Deleting an open pause just un-pauses the client.';
  }
  return 'The connection status is recalculated from whichever events remain.';
}
