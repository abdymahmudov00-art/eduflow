import styles from "./spinner.module.css";

interface SpinnerProps {
  /** Растянуть на весь экран (для проверки доступа) */
  fullscreen?: boolean;
  label?: string;
}

const Spinner = ({ fullscreen = false, label = "Загрузка…" }: SpinnerProps) => (
  <div className={fullscreen ? styles.fullscreen : styles.inline} role="status">
    <span className={styles.circle} aria-hidden="true" />
    <span className={styles.label}>{label}</span>
  </div>
);

export default Spinner;
