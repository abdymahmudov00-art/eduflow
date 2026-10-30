import { useId, type TextareaHTMLAttributes } from "react";
import styles from "./textarea.module.css";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

const Textarea = ({ label, error, hint, id, required, rows = 3, ...rest }: TextareaProps) => {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <div className={styles.field}>
      <label htmlFor={fieldId} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        className={`${styles.textarea} ${error ? styles.invalid : ""}`}
        aria-invalid={Boolean(error)}
        required={required}
        {...rest}
      />
      {error ? <span className={styles.error}>{error}</span> : hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default Textarea;
