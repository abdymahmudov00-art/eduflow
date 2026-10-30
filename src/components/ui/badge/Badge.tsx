import type { ReactNode } from "react";
import styles from "./badge.module.css";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

const Badge = ({ tone = "neutral", children }: BadgeProps) => (
  <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>
);

export default Badge;
