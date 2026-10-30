import type { ReactNode } from "react";
import styles from "./row-actions.module.css";

/** Кнопки действий в строке таблицы */
const RowActions = ({ children }: { children: ReactNode }) => (
  <div className={styles.actions}>{children}</div>
);

export default RowActions;
