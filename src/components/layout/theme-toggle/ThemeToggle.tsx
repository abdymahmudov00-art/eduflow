"use client";

import { useSyncExternalStore } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "@/components/layout/header/header.module.css";

type Theme = "dark" | "light";

const STORAGE_KEY = "eduflow-theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function applyTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // приватный режим — тема просто не запомнится
  }
  listeners.forEach((l) => l());
}

/** Переключатель «день / ночь». Выбор хранится в браузере и ставится до отрисовки (скрипт в layout) */
const ThemeToggle = () => {
  // На сервере темы не знаем — рисуем ночную, в браузере сразу берём настоящую
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark" as Theme);
  const label = theme === "light" ? "Включить ночную тему" : "Включить дневную тему";

  return (
    <button
      type="button"
      className={styles.iconBtn}
      onClick={() => applyTheme(theme === "light" ? "dark" : "light")}
      aria-label={label}
      title={label}
    >
      <Icon name={theme === "light" ? "moon" : "sun"} size={19} />
    </button>
  );
};

export default ThemeToggle;
