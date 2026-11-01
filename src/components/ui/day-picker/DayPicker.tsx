"use client";

import type { Weekday } from "@/lib/api/types";
import { WEEKDAYS } from "@/lib/labels";
import styles from "./day-picker.module.css";

interface DayPickerProps {
  label: string;
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  /** false — можно выбрать только один день (при редактировании занятия) */
  multiple?: boolean;
  error?: string;
  required?: boolean;
}

const PRESETS: { label: string; days: Weekday[] }[] = [
  { label: "Пн–Ср–Пт", days: ["Monday", "Wednesday", "Friday"] },
  { label: "Вт–Чт–Сб", days: ["Tuesday", "Thursday", "Saturday"] },
  { label: "Будни", days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
];

const sameDays = (a: Weekday[], b: Weekday[]) => a.length === b.length && a.every((d) => b.includes(d));

/** Выбор дней недели кнопками; в режиме multiple — несколько сразу */
const DayPicker = ({ label, value, onChange, multiple = true, error, required }: DayPickerProps) => {
  const toggle = (day: Weekday) => {
    if (!multiple) {
      onChange([day]);
      return;
    }
    const next = value.includes(day) ? value.filter((d) => d !== day) : [...value, day];
    // Храним в порядке недели, а не в порядке нажатий
    onChange(WEEKDAYS.map((d) => d.value).filter((d) => next.includes(d)));
  };

  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
        {multiple && <span className={styles.note}>можно несколько</span>}
      </span>

      <div className={styles.days}>
        {WEEKDAYS.map((day) => {
          const on = value.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={on}
              title={day.label}
              className={`${styles.day} ${on ? styles.on : ""}`}
              onClick={() => toggle(day.value)}
            >
              {day.short}
            </button>
          );
        })}
      </div>

      {multiple && (
        <div className={styles.presets}>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`${styles.preset} ${sameDays(value, preset.days) ? styles.presetOn : ""}`}
              onClick={() => onChange(preset.days)}
            >
              {preset.label}
            </button>
          ))}
          {value.length > 0 && (
            <button type="button" className={styles.clear} onClick={() => onChange([])}>
              Сбросить
            </button>
          )}
        </div>
      )}

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
};

export default DayPicker;
