import type { ReactNode } from "react";
import styles from "./card.module.css";

interface CardProps {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

const Card = ({ title, actions, children, className }: CardProps) => (
  <section className={`${styles.card} ${className ?? ""}`}>
    {(title || actions) && (
      <div className={styles.header}>
        {title && <h2 className={styles.title}>{title}</h2>}
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    )}
    <div className={styles.body}>{children}</div>
  </section>
);

export default Card;
