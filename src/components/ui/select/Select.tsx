import { useId, type SelectHTMLAttributes } from "react";
import styles from "./select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  hint?: string;
}

const Select = ({
  label,
  options,
  placeholder,
  error,
  hint,
  id,
  className,
  required,
  ...rest
}: SelectProps) => {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className={`${styles.field} ${className ?? ""}`}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <select
        id={selectId}
        className={`${styles.select} ${error ? styles.invalid : ""}`}
        aria-invalid={Boolean(error)}
        required={required}
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className={styles.error}>{error}</span> : hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default Select;
