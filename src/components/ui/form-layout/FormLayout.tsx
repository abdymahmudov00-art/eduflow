import type { ReactNode } from "react";
import styles from "./form-layout.module.css";

/** Сетка полей формы: 2 колонки на десктопе, 1 на телефоне */
export const FormGrid = ({ children }: { children: ReactNode }) => (
  <div className={styles.grid}>{children}</div>
);

/** Блок с заголовком внутри формы */
export const FormSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className={styles.section}>
    <legend className={styles.legend}>{title}</legend>
    {children}
  </fieldset>
);

/** Кнопки внизу формы */
export const FormActions = ({ children }: { children: ReactNode }) => (
  <div className={styles.actions}>{children}</div>
);

/** Поле на всю ширину сетки */
export const FullRow = ({ children }: { children: ReactNode }) => (
  <div className={styles.full}>{children}</div>
);
