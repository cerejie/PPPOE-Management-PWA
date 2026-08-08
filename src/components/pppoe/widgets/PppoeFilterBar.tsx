import { FilterChip } from '@/common/components/buttons/FilterChip';
import * as styles from '@/styles/pages/pppoe/widgets/PppoeFilterBar.css';
import { PPPOE_FILTER_CHIPS, type PppoeFilter } from '@/constants/pppoe/PppoeAccounts.constants';

interface Props {
  filter: PppoeFilter;
  onChange: (filter: PppoeFilter) => void;
}

/** Single-select: the filters narrow different axes and would fight if combined. */
export function PppoeFilterBar({ filter, onChange }: Props) {
  return (
    <div className={styles.bar}>
      {PPPOE_FILTER_CHIPS.map((chip) => (
        <FilterChip
          key={chip.value}
          active={filter === chip.value}
          onClick={() => onChange(chip.value)}
        >
          {chip.label}
        </FilterChip>
      ))}
    </div>
  );
}
