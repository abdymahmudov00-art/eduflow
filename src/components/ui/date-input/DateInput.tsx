"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./date-input.module.css";

interface DateInputProps {
  label: string;
  /** "YYYY-MM-DD" или "" — так же, как ждёт бэкенд */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
}

export const MONTHS_NOMINATIVE = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];
const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

/** "2026-09-15" → "15.09.2026" */
const isoToText = (iso: string) => (iso ? `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}` : "");

/** Цифры → "дд.мм.гггг" по мере ввода */
function mask(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(".");
}

/** "15.09.2026" → "2026-09-15"; null — такой даты нет (31.02 и т.п.) */
export function parseDate(text: string): string | null {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const date = new Date(y, mo, d);
  if (y < 1900 || date.getFullYear() !== y || date.getMonth() !== mo || date.getDate() !== d) return null;
  return toIso(y, mo, d);
}

/** Поле даты в формате дд.мм.гггг + календарь на русском (неделя с понедельника) */
const DateInput = ({ label, value, onChange, error, hint, required, placeholder = "дд.мм.гггг" }: DateInputProps) => {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(isoToText(value));
  const [invalid, setInvalid] = useState(false);
  // Значение поменяли снаружи (например, форму очистили) — обновляем текст в поле
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== (parseDate(text) ?? "")) setText(isoToText(value));
  }
  /** Открытый календарь: какой месяц показан + сегодняшняя дата (считаем в момент открытия) */
  const [view, setView] = useState<{ year: number; month: number; today: string } | null>(null);

  const commit = (iso: string) => {
    setText(isoToText(iso));
    setInvalid(false);
    onChange(iso);
  };

  const commitTyped = () => {
    if (!text) {
      setInvalid(false);
      onChange("");
      return;
    }
    const iso = parseDate(text);
    if (iso) commit(iso);
    else {
      setInvalid(true);
      onChange("");
    }
  };

  const openCalendar = () => {
    const now = new Date();
    const base = value ? new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, 1) : now;
    setView({
      year: base.getFullYear(),
      month: base.getMonth(),
      today: toIso(now.getFullYear(), now.getMonth(), now.getDate()),
    });
  };

  const shiftMonth = (delta: number) =>
    setView((v) => {
      if (!v) return v;
      const total = v.year * 12 + v.month + delta;
      return { ...v, year: Math.floor(total / 12), month: total % 12 };
    });

  useEffect(() => {
    if (!view) return;
    const onPointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setView(null);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setView(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [view]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTyped();
      setView(null);
    } else if (event.key === "ArrowDown" && !view) {
      event.preventDefault();
      openCalendar();
    }
  };

  // Сетка календаря: пустые клетки до 1-го числа (понедельник — первый день)
  const cells: (number | null)[] = [];
  if (view) {
    const firstWeekday = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  }
  const years = view ? Array.from({ length: view.year + 10 - 1940 + 1 }, (_, i) => view.year + 10 - i) : [];
  const shownError = error ?? (invalid ? "Формат дд.мм.гггг, например 15.09.2026" : undefined);

  return (
    <div className={styles.field} ref={wrapperRef}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      <div className={styles.control}>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          maxLength={10}
          className={`${styles.input} ${shownError ? styles.invalid : ""}`}
          aria-invalid={Boolean(shownError)}
          value={text}
          onChange={(e) => {
            setText(mask(e.target.value));
            setInvalid(false);
          }}
          onBlur={commitTyped}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={`${styles.toggle} ${view ? styles.toggleOpen : ""}`}
          aria-label="Открыть календарь"
          aria-expanded={Boolean(view)}
          onClick={() => (view ? setView(null) : openCalendar())}
        >
          <Icon name="calendar" size={17} />
        </button>

        {view && (
          <div className={styles.popover} role="dialog" aria-label="Календарь">
            <div className={styles.head}>
              <button type="button" className={styles.nav} aria-label="Предыдущий месяц" onClick={() => shiftMonth(-1)}>
                <Icon name="chevron" size={16} className={styles.flip} />
              </button>
              <select
                className={styles.select}
                aria-label="Месяц"
                value={view.month}
                onChange={(e) => setView({ ...view, month: Number(e.target.value) })}
              >
                {MONTHS_NOMINATIVE.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className={styles.select}
                aria-label="Год"
                value={view.year}
                onChange={(e) => setView({ ...view, year: Number(e.target.value) })}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <button type="button" className={styles.nav} aria-label="Следующий месяц" onClick={() => shiftMonth(1)}>
                <Icon name="chevron" size={16} />
              </button>
            </div>

            <div className={styles.grid}>
              {WEEK.map((w, i) => (
                <span key={w} className={`${styles.weekday} ${i >= 5 ? styles.weekend : ""}`}>
                  {w}
                </span>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <span key={`e${i}`} />;
                const iso = toIso(view.year, view.month, day);
                return (
                  <button
                    key={iso}
                    type="button"
                    className={`${styles.day} ${iso === value ? styles.selected : ""} ${
                      iso === view.today ? styles.today : ""
                    }`}
                    onClick={() => {
                      commit(iso);
                      setView(null);
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.todayBtn}
              onClick={() => {
                commit(view.today);
                setView(null);
              }}
            >
              Сегодня
            </button>
          </div>
        )}
      </div>
      {shownError ? (
        <span className={styles.error}>{shownError}</span>
      ) : (
        hint && <span className={styles.hint}>{hint}</span>
      )}
    </div>
  );
};

export default DateInput;
