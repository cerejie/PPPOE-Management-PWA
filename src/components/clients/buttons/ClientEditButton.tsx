import { Link } from 'react-router-dom';
import * as styles from '@/styles/pages/clients/buttons/ClientEditButton.css';

/** Header action on a client's detail screen. Only a SuperAdmin ever sees it. */
export function ClientEditButton({ to }: { to: string }) {
  return (
    <Link to={to} aria-label="Edit client" className={styles.button}>
      Edit
    </Link>
  );
}
