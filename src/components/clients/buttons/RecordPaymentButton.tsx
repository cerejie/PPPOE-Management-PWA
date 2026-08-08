import * as styles from '@/styles/pages/clients/buttons/RecordPaymentButton.css';

/** Primary action on a client's detail screen: opens the payment sheet. */
export function RecordPaymentButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={styles.button}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      Record payment
    </button>
  );
}
