import type { ConnectionStatus } from '@/lib/types';

export function StatusDot({ status }: { status: ConnectionStatus }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
        status === 'connected' ? 'bg-ok' : 'bg-slate-300'
      }`}
      aria-label={status}
      role="img"
    />
  );
}
