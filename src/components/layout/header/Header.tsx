"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import Avatar from "@/components/ui/avatar/Avatar";
import Icon from "@/components/ui/icon/Icon";
import { findActiveItem, type NavItem } from "@/config/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { ROLE_LABELS } from "@/lib/labels";
import styles from "./header.module.css";

interface HeaderProps {
  items: NavItem[];
  profileHref: string;
  onMenuClick: () => void;
}

/** Верхняя панель кабинета: название раздела, роль, аватар, выход */
const Header = ({ items, profileHref, onMenuClick }: HeaderProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  // Профиль не в меню (он в карточке пользователя), но заголовок для него нужен
  const title =
    findActiveItem([...items, { href: profileHref, label: "Профиль", icon: "user" }], pathname)?.label ?? "EduFlow";

  const handleLogout = async () => {
    setLeaving(true);
    await logout();
    router.replace("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <button type="button" className={styles.iconBtn + " " + styles.menuBtn} onClick={onMenuClick} aria-label="Открыть меню">
          <Icon name="menu" />
        </button>
        <span className={styles.title}>{title}</span>
        {/* На телефоне вместо названия раздела — логотип */}
        <Link href={items[0]?.href ?? "/"} className={styles.logo}>
          <span className={styles.mark}>
            <Icon name="sparkle" size={20} />
          </span>
          EduFlow
        </Link>
      </div>

      {session && (
        <div className={styles.right}>
          <span className={styles.chip}>
            <Icon name={session.role === "admin" ? "shield" : "book"} size={15} />
            {ROLE_LABELS[session.role]}
          </span>
          <Link href={profileHref} className={styles.avatarLink} aria-label="Профиль">
            <Avatar name={session.username} size={40} />
          </Link>
          <button
            type="button"
            className={`${styles.iconBtn} ${styles.logoutBtn}`}
            onClick={handleLogout}
            disabled={leaving}
            aria-label="Выйти"
            title="Выйти"
          >
            <Icon name="logout" size={19} />
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
