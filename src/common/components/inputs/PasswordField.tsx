import { useStore } from 'zustand';
import { useInstanceStore } from '@/common/stores/createInstanceStore';
import * as form from '@/styles/global/Form.css';
import * as styles from '@/styles/common/inputs/PasswordField.css';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** Whether this field is showing its value. Two on a form must not share it. */
interface PasswordFieldUiState {
  revealed: boolean;
}

/**
 * Password input with a reveal toggle.
 *
 * Masked by default so a value is not read over someone's shoulder, revealable
 * because the operator often has to read it back to a subscriber.
 */
export function PasswordField({ id, label, value, onChange }: Props) {
  const ui = useInstanceStore<PasswordFieldUiState>(() => ({ revealed: false }));
  const revealed = useStore(ui, (s) => s.revealed);

  return (
    <div>
      <label htmlFor={id} className={form.label}>
        {label}
      </label>
      <div className={styles.row}>
        <input
          id={id}
          type={revealed ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          className={styles.field}
        />
        <button
          type="button"
          onClick={() => ui.setState((s) => ({ revealed: !s.revealed }))}
          aria-pressed={revealed}
          className={styles.reveal}
        >
          {revealed ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
