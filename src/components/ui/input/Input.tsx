import { useId, type InputHTMLAttributes } from "react";
import styles from "./input.module.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Input = ({ label, error, hint, id, className, required, ...rest }: InputProps) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`${styles.field} ${className ?? ""}`}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <input
        id={inputId}
        className={`${styles.input} ${error ? styles.invalid : ""}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        required={required}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} className={styles.error}>
          {error}
        </span>
      ) : (
        hint && (
          <span id={`${inputId}-hint`} className={styles.hint}>
            {hint}
          </span>
        )
      )}
    </div>
  );
};

export default Input;
