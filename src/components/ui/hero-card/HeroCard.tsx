import type { ReactNode } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./hero-card.module.css";

interface HeroCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Плашка справа сверху */
  tag?: string;
  /** Зелёная плашка под числом */
  note?: ReactNode;
  actions?: ReactNode;
}

/** Главная градиентная карточка с крупным числом */
const HeroCard = ({ label, value, unit, tag, note, actions }: HeroCardProps) => (
  <section className={styles.hero}>
    <div className={styles.top}>
      <span className={styles.label}>{label}</span>
      {tag && (
        <span className={styles.tag}>
          <Icon name="sparkle" size={13} />
          {tag}
        </span>
      )}
    </div>
    <div className={styles.valueRow}>
      <strong className={styles.value}>{value}</strong>
      {unit && <span className={styles.unit}>{unit}</span>}
    </div>
    {note && <span className={styles.note}>{note}</span>}
    {actions && <div className={styles.actions}>{actions}</div>}
  </section>
);

export default HeroCard;
