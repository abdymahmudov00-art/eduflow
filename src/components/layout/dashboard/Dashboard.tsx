"use client";

import { useCallback, useState, type ReactNode } from "react";
import BottomNav from "@/components/layout/bottom-nav/BottomNav";
import Header from "@/components/layout/header/Header";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import type { NavItem } from "@/config/navigation";
import { MenuContext } from "./menu-context";
import styles from "./dashboard.module.css";

interface DashboardProps {
  nav: NavItem[];
  /** Разделы нижней панели на телефоне */
  tabs: NavItem[];
  profileHref: string;
  children: ReactNode;
}

/**
 * Каркас кабинета.
 * Компьютер: меню слева, верхняя панель и контент.
 * Телефон: логотип и аватар сверху, нижняя панель, остальные разделы — в «Ещё».
 */
const Dashboard = ({ nav, tabs, profileHref, children }: DashboardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);

  return (
    <MenuContext.Provider value={openMenu}>
      <div className={styles.dashboard}>
        <Sidebar items={nav} profileHref={profileHref} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className={styles.main}>
          <Header items={nav} profileHref={profileHref} onMenuClick={openMenu} />
          <div className={styles.content}>{children}</div>
        </div>
        <BottomNav items={tabs} menuOpen={menuOpen} onMoreClick={openMenu} />
      </div>
    </MenuContext.Provider>
  );
};

export default Dashboard;
