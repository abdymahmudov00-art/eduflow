"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@/components/ui/avatar/Avatar";
import Icon from "@/components/ui/icon/Icon";
import { findActiveItem, type NavItem } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { ROLE_LABELS } from "@/lib/labels";
import styles from "./sidebar.module.css";

interface SidebarProps {
  items: NavItem[];
  profileHref: string;
  /** Открыто ли меню на мобильном */
  open: boolean;
  onClose: () => void;
}

const Sidebar = ({ items, profileHref, open, onClose }: SidebarProps) => {
  const pathname = usePathname();
  const { session } = useAuth();
  const active = findActiveItem(items, pathname);

  return (
    <>
      <div className={`${styles.backdrop} ${open ? styles.backdropVisible : ""}`} onClick={onClose} />
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.top}>
          <Link href={items[0]?.href ?? "/"} className={styles.logo} onClick={onClose}>
            <span className={styles.mark}>
              <Icon name="sparkle" size={18} />
            </span>
            EduFlow
          </Link>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть меню">
            <Icon name="close" size={18} />
          </button>
        </div>

        <nav className={styles.nav} aria-label="Разделы">
          {items.map((item) => {
            const isActive = item.href === active?.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.link} ${isActive ? styles.active : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={onClose}
              >
                <Icon name={item.icon} size={19} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {session && (
          <Link
            href={profileHref}
            className={`${styles.userCard} ${pathname === profileHref ? styles.userCardActive : ""}`}
            onClick={onClose}
          >
            <Avatar name={session.username} size={36} />
            <span className={styles.userText}>
              <span className={styles.userName}>{session.username}</span>
              <span className={styles.userRole}>{ROLE_LABELS[session.role]}</span>
            </span>
            <Icon name="chevron" size={16} className={styles.userChevron} />
          </Link>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
