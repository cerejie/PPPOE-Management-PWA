import type { ConnectionStatus } from '@/lib/types';

export function StatusDot({ status }: { status: ConnectionStatus }) {
  const connected = status === 'connected';
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
        connected ? 'bg-ok ring-4 ring-ok/20' : 'bg-muted/40'
      }`}
      aria-label={status}
      role="img"
    />
  );
}
