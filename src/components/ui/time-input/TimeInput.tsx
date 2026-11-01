"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./time-input.module.css";

interface TimeInputProps {
  label: string;
  /** "HH:MM" (24 часа) или "" */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  /** Шаг минут в выпадающем списке */
  minuteStep?: number;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Разбор того, что ввели руками: "9" → 09:00, "930" → 09:30, "1430" → 14:30, "9:5" → 09:05.
 * null — время некорректное.
 */
export function parseTime(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  let h: number;
  let m: number;
  if (/[:.\s]/.test(text)) {
    const [hh, mm = "0"] = text.split(/[:.\s]+/);
    if (!/^\d{1,2}$/.test(hh) || !/^\d{1,2}$/.test(mm)) return null;
    h = Number(hh);
    m = Number(mm);
  } else {
    if (!/^\d{1,4}$/.test(text)) return null;
    if (text.length <= 2) {
      h = Number(text);
      m = 0;
    } else {
      h = Number(text.slice(0, text.length - 2));
      m = Number(text.slice(-2));
    }
  }
  if (h > 23 || m > 59) return null;
  return `${pad(h)}:${pad(m)}`;
}

/** Поле времени в 24-часовом формате: ввод с клавиатуры + выбор часов и минут из списка */
const TimeInput = ({ label, value, onChange, error, required, minuteStep = 5 }: TimeInputProps) => {
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);
  // Значение поменяли снаружи — обновляем текст в поле
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== (parseTime(text) ?? "")) setText(value);
  }

  const [hour, minute] = value ? value.split(":").map(Number) : [null, null];
  const minutes = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => i * minuteStep);
  // Если вписали минуты не по шагу (например, 42) — тоже покажем их в списке
  if (minute !== null && !minutes.includes(minute)) {
    minutes.push(minute);
    minutes.sort((a, b) => a - b);
  }

  const commit = (next: string) => {
    setText(next);
    setInvalid(false);
    onChange(next);
  };

  const commitTyped = () => {
    if (!text.trim()) {
      setInvalid(false);
      onChange("");
      return;
    }
    const parsed = parseTime(text);
    if (parsed) commit(parsed);
    else {
      setInvalid(true);
      onChange("");
    }
  };

  // Закрытие по клику мимо и Esc; прокрутка к выбранным часам/минутам при открытии
  useEffect(() => {
    if (!open) return;
    hoursRef.current?.querySelector<HTMLElement>("[data-selected='true']")?.scrollIntoView({ block: "center" });
    minutesRef.current?.querySelector<HTMLElement>("[data-selected='true']")?.scrollIntoView({ block: "center" });
    const onPointer = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitTyped();
      setOpen(false);
    } else if (event.key === "ArrowDown" && !open) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const shownError = error ?? (invalid ? "Формат чч:мм, например 14:30" : undefined);

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
          placeholder="чч:мм"
          maxLength={5}
          className={`${styles.input} ${shownError ? styles.invalid : ""}`}
          aria-invalid={Boolean(shownError)}
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d:.]/g, ""))}
          onBlur={commitTyped}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className={`${styles.toggle} ${open ? styles.toggleOpen : ""}`}
          aria-label="Выбрать время"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="clock" size={17} />
        </button>

        {open && (
          <div className={styles.popover} role="dialog" aria-label="Выбор времени">
            <div className={styles.column} ref={hoursRef}>
              <span className={styles.columnTitle}>Часы</span>
              {Array.from({ length: 24 }, (_, h) => (
                <button
                  key={h}
                  type="button"
                  data-selected={h === hour}
                  className={`${styles.cell} ${h === hour ? styles.cellActive : ""}`}
                  onClick={() => commit(`${pad(h)}:${pad(minute ?? 0)}`)}
                >
                  {pad(h)}
                </button>
              ))}
            </div>
            <div className={styles.column} ref={minutesRef}>
              <span className={styles.columnTitle}>Мин</span>
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-selected={m === minute}
                  className={`${styles.cell} ${m === minute ? styles.cellActive : ""}`}
                  onClick={() => {
                    commit(`${pad(hour ?? 9)}:${pad(m)}`);
                    setOpen(false);
                  }}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {shownError && <span className={styles.error}>{shownError}</span>}
    </div>
  );
};

export default TimeInput;
