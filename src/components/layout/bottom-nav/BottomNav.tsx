"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/icon/Icon";
import { findActiveItem, type NavItem } from "@/config/navigation";
import styles from "./bottom-nav.module.css";

interface BottomNavProps {
  items: NavItem[];
  /** Открыто ли меню «Ещё» — тогда подсвечиваем его */
  menuOpen: boolean;
  onMoreClick: () => void;
}

/** Нижняя панель на телефоне: основные разделы + «Ещё» (открывает меню со всеми разделами) */
const BottomNav = ({ items, menuOpen, onMoreClick }: BottomNavProps) => {
  const pathname = usePathname();
  const active = findActiveItem(items, pathname);
  // Раздела нет в панели (анкета, контракт, профиль…) — значит, он в «Ещё»
  const moreActive = menuOpen || !active;

  return (
    <nav className={styles.bar} aria-label="Основные разделы">
      {items.map((item) => {
        const isActive = !menuOpen && item.href === active?.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className={styles.icon}>
              <Icon name={item.icon} size={21} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className={`${styles.item} ${moreActive ? styles.active : ""}`}
        onClick={onMoreClick}
        aria-label="Все разделы"
      >
        <span className={styles.icon}>
          <Icon name="user" size={21} />
        </span>
        <span className={styles.label}>Ещё</span>
      </button>
    </nav>
  );
};

export default BottomNav;
