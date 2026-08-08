import type { ConnectionStatus } from '@/types/clients/Clients.types';
import { dot } from '@/common/components/badges/StatusDot.css';

export function StatusDot({ status }: { status: ConnectionStatus }) {
  const connected = status === 'connected';
  return (
    <span
      className={connected ? dot.connected : dot.disconnected}
      aria-label={status}
      role="img"
    />
  );
}
