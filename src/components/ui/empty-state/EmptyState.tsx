import type { ReactNode } from "react";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import styles from "./empty-state.module.css";

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description: string;
  children?: ReactNode;
}

/** Пустое состояние / заглушка раздела, который ещё не подключён */
const EmptyState = ({ icon, title, description, children }: EmptyStateProps) => (
  <div className={styles.empty}>
    <span className={styles.icon}>
      <Icon name={icon} size={28} />
    </span>
    <h2 className={styles.title}>{title}</h2>
    <p className={styles.description}>{description}</p>
    {children && <div className={styles.extra}>{children}</div>}
  </div>
);

export default EmptyState;
