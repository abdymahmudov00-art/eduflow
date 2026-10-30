import type { ReactNode } from "react";
import styles from "./info-list.module.css";

export interface InfoRow {
  label: string;
  value: ReactNode;
}

/** Список «название — значение» для карточек профиля */
const InfoList = ({ rows }: { rows: InfoRow[] }) => (
  <dl className={styles.list}>
    {rows.map((row) => (
      <div key={row.label} className={styles.row}>
        <dt>{row.label}</dt>
        <dd>{row.value}</dd>
      </div>
    ))}
  </dl>
);

export default InfoList;
