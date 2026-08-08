import { Link } from 'react-router-dom';
import { StatusDot } from '@/common/components/badges/StatusDot';
import { ExpiryBadge } from '@/common/components/badges/ExpiryBadge';
import { SyncBadge } from '@/common/components/badges/SyncBadge';
import * as styles from '@/styles/pages/clients/lists/ClientListItem.css';
import type { EntityWriteState } from '@/api/sync/syncEngine';
import type { Client } from '@/types/clients/Clients.types';

interface Props {
  client: Client;
  /** Undefined when the client is unassigned or the room is not mirrored yet. */
  roomName: string | undefined;
  syncState: EntityWriteState | undefined;
  to: string;
}

/** One entry in the client list. */
export function ClientListItem({ client, roomName, syncState, to }: Props) {
  return (
    <li>
      <Link to={to} className={styles.link}>
        <div className={styles.identity}>
          <StatusDot status={client.connection_status} />
          <div className={styles.text}>
            <p className={styles.name}>{client.full_name}</p>
            <p className={styles.meta}>
              {client.pppoe_username}
              {roomName ? ` · ${roomName}` : ''}
            </p>
          </div>
        </div>
        <div className={styles.badges}>
          <SyncBadge state={syncState} />
          <ExpiryBadge expiresAt={client.expires_at} pausedAt={client.paused_at} />
        </div>
      </Link>
    </li>
  );
}
