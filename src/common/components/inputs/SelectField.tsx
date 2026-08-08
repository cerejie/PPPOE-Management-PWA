import * as form from '@/styles/global/Form.css';

export interface SelectFieldOption {
  readonly value: string;
  readonly label: string;
}

interface Props {
  id: string;
  label: string;
  value: string;
  options: readonly SelectFieldOption[];
  onChange: (value: string) => void;
}

/** Labelled native select — the platform picker is the right control on a phone. */
export function SelectField({ id, label, value, options, onChange }: Props) {
  return (
    <div>
      <label htmlFor={id} className={form.label}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={form.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
