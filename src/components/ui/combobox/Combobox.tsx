"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./combobox.module.css";

export interface ComboboxOption {
  value: string;
  label: string;
  /** Серая подпись справа (например, номер студента) — по ней тоже ищем */
  hint?: string;
}

interface ComboboxProps {
  label: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  emptyText?: string;
}

/** Без учёта регистра и «ё» */
const normalize = (text: string) => text.toLowerCase().replace(/ё/g, "е").trim();

/** Выпадающий список с поиском: печатаете — список фильтруется */
const Combobox = ({
  label,
  options,
  value,
  onChange,
  placeholder = "Начните вводить…",
  error,
  hint,
  required,
  emptyText = "Ничего не найдено",
}: ComboboxProps) => {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value);
  const words = normalize(query).split(/\s+/).filter(Boolean);
  // Все слова запроса должны встретиться в имени или подписи: «ива 01» найдёт «Иванов Иван · ST-2026-01»
  const filtered = words.length
    ? options.filter((o) => {
        const text = normalize(`${o.label} ${o.hint ?? ""}`);
        return words.every((w) => text.includes(w));
      })
    : options;

  // Держим подсвеченный пункт в зоне видимости
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const openList = () => {
    setOpen(true);
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
  };

  const choose = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (filtered.length ? (i + step + filtered.length) % filtered.length : 0));
    } else if (event.key === "Enter") {
      if (open && filtered[active]) {
        event.preventDefault();
        choose(filtered[active]);
      }
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>

      <div className={styles.control}>
        <Icon name="search" size={17} className={styles.searchIcon} />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-opt-${active}` : undefined}
          aria-invalid={Boolean(error)}
          className={`${styles.input} ${error ? styles.invalid : ""}`}
          placeholder={selected && !open ? undefined : placeholder}
          value={open ? query : selected ? `${selected.label}${selected.hint ? ` · ${selected.hint}` : ""}` : ""}
          onFocus={openList}
          onClick={() => !open && openList()}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => {
            setOpen(false);
            setQuery("");
          }}
          onKeyDown={handleKeyDown}
        />
        <Icon name="chevron" size={16} className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`} />

        {open && (
          <ul ref={listRef} id={listId} role="listbox" className={styles.list}>
            {filtered.length === 0 ? (
              <li className={styles.empty}>{emptyText}</li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  id={`${id}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={option.value === value}
                  className={`${styles.option} ${index === active ? styles.active : ""} ${
                    option.value === value ? styles.selected : ""
                  }`}
                  // mousedown, а не click: иначе поле потеряет фокус и список закроется раньше выбора
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.hint && <span className={styles.optionHint}>{option.hint}</span>}
                  {option.value === value && <Icon name="check" size={15} className={styles.check} />}
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {error ? <span className={styles.error}>{error}</span> : hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default Combobox;
