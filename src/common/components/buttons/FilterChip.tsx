import * as styles from '@/styles/common/buttons/FilterChip.css';

export type FilterChipTone = 'raised' | 'flat';

interface Props {
  active: boolean;
  onClick: () => void;
  /** `raised` on a page background, `flat` inside a card or sheet. */
  tone?: FilterChipTone;
  children: string;
}

export function FilterChip({ active, onClick, tone = 'raised', children }: Props) {
  const variant = tone === 'raised' ? (active ? 'raisedActive' : 'raisedIdle') : active ? 'flatActive' : 'flatIdle';

  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={styles.chip[variant]}>
      {children}
    </button>
  );
}
