import type { ReactNode } from "react";
import styles from "./alert.module.css";

interface AlertProps {
  tone?: "error" | "success" | "info";
  children: ReactNode;
  onClose?: () => void;
}

const Alert = ({ tone = "error", children, onClose }: AlertProps) => (
  <div className={`${styles.alert} ${styles[tone]}`} role={tone === "error" ? "alert" : "status"}>
    <div className={styles.text}>{children}</div>
    {onClose && (
      <button type="button" className={styles.close} onClick={onClose} aria-label="Скрыть">
        ×
      </button>
    )}
  </div>
);

export default Alert;
