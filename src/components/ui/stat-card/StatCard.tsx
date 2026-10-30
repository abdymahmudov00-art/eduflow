import type { ReactNode } from "react";
import styles from "./stat-card.module.css";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}

const StatCard = ({ label, value, hint, accent = false }: StatCardProps) => (
  <div className={`${styles.card} ${accent ? styles.accent : ""}`}>
    <span className={styles.label}>{label}</span>
    <strong className={styles.value}>{value}</strong>
    {hint && <span className={styles.hint}>{hint}</span>}
  </div>
);

export default StatCard;
