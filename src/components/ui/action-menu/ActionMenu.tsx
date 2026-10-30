"use client";

import { useEffect, useId, useRef, useState } from "react";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import styles from "./action-menu.module.css";

export interface ActionMenuItem {
  label: string;
  icon?: IconName;
  onClick: () => void;
  /** Красный пункт (удаление и т.п.) */
  danger?: boolean;
  disabled?: boolean;
  /** Скрыть пункт (удобно для условий) */
  hidden?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  /** Подпись для скринридера */
  label?: string;
}

const MENU_WIDTH = 210;

/**
 * Кнопка «⋯» с выпадающим списком действий.
 * Список позиционируется fixed, чтобы его не обрезала прокрутка таблицы.
 */
const ActionMenu = ({ items, label = "Действия" }: ActionMenuProps) => {
  const [position, setPosition] = useState<{ top: number; left: number; up: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const visible = items.filter((item) => !item.hidden);
  const open = position !== null;

  const toggle = () => {
    if (open) {
      setPosition(null);
      return;
    }
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Если снизу мало места — открываем вверх
    const estimated = visible.length * 42 + 12;
    const up = rect.bottom + estimated + 8 > window.innerHeight && rect.top > estimated;
    setPosition({
      top: up ? rect.top - 6 : rect.bottom + 6,
      left: Math.max(8, rect.right - MENU_WIDTH),
      up,
    });
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setPosition(null);
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    // Фокус на первый пункт для клавиатуры
    menuRef.current?.querySelector<HTMLButtonElement>("button:not(:disabled)")?.focus();
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  if (visible.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <button
        ref={buttonRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={toggle}
      >
        <Icon name="dots" size={20} />
      </button>

      {position && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className={styles.menu}
          style={{
            top: position.top,
            left: position.left,
            width: MENU_WIDTH,
            transform: position.up ? "translateY(-100%)" : undefined,
          }}
        >
          {visible.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`${styles.item} ${item.danger ? styles.danger : ""}`}
              disabled={item.disabled}
              onClick={() => {
                setPosition(null);
                item.onClick();
              }}
            >
              {item.icon && <Icon name={item.icon} size={17} />}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionMenu;
