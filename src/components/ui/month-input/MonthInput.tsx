"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/ui/icon/Icon";
import { formatMonth } from "@/lib/format";
import styles from "./month-input.module.css";

interface MonthInputProps {
  label: string;
  /** "YYYY-MM" или "" — так же, как payment_month на бэкенде */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
}

const SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];

/** Выбор месяца и года на русском: «декабрь 2026» */
const MonthInput = ({ label, value, onChange, error, hint, required }: MonthInputProps) => {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState<number | null>(null);
  const open = year !== null;
  const [selYear, selMonth] = value ? [Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1] : [null, null];

  const toggle = () => setYear(open ? null : (selYear ?? new Date().getFullYear()));

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setYear(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setYear(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.field} ref={wrapperRef}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <div className={styles.control}>
        <button
          id={id}
          type="button"
          className={`${styles.trigger} ${error ? styles.invalid : ""} ${open ? styles.triggerOpen : ""}`}
          aria-expanded={open}
          onClick={toggle}
        >
          <span className={value ? styles.value : styles.placeholder}>
            {value ? formatMonth(value) : "Выберите месяц"}
          </span>
          <Icon name="calendar" size={17} />
        </button>

        {open && (
          <div className={styles.popover} role="dialog" aria-label="Выбор месяца">
            <div className={styles.head}>
              <button type="button" className={styles.nav} aria-label="Предыдущий год" onClick={() => setYear(year - 1)}>
                <Icon name="chevron" size={16} className={styles.flip} />
              </button>
              <strong className={styles.year}>{year}</strong>
              <button type="button" className={styles.nav} aria-label="Следующий год" onClick={() => setYear(year + 1)}>
                <Icon name="chevron" size={16} />
              </button>
            </div>
            <div className={styles.months}>
              {SHORT.map((name, m) => {
                const active = year === selYear && m === selMonth;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`${styles.month} ${active ? styles.active : ""}`}
                    onClick={() => {
                      onChange(`${year}-${String(m + 1).padStart(2, "0")}`);
                      setYear(null);
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {error ? <span className={styles.error}>{error}</span> : hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default MonthInput;
