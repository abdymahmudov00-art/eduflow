"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "@/components/layout/header/header.module.css";

type Theme = "dark" | "light";

const STORAGE_KEY = "eduflow-theme";

/** Переключатель «день / ночь». Выбор хранится в браузере и ставится до отрисовки (скрипт в layout) */
const ThemeToggle = () => {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // приватный режим — тема просто не запомнится
    }
    setTheme(next);
  };

  const label = theme === "light" ? "Включить ночную тему" : "Включить дневную тему";

  return (
    <button type="button" className={styles.iconBtn} onClick={toggle} aria-label={label} title={label}>
      <Icon name={theme === "light" ? "moon" : "sun"} size={19} />
    </button>
  );
};

export default ThemeToggle;
