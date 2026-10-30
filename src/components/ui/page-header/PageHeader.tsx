import type { ReactNode } from "react";
import styles from "./page-header.module.css";

interface PageHeaderProps {
  /** Маленькая подпись над заголовком */
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

const PageHeader = ({ kicker, title, description, actions }: PageHeaderProps) => (
  <div className={styles.header}>
    <div>
      {kicker && <span className={styles.kicker}>{kicker}</span>}
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
    </div>
    {actions && <div className={styles.actions}>{actions}</div>}
  </div>
);

export default PageHeader;
