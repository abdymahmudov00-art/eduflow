"use client";

import { useState, type ReactNode } from "react";
import Header from "@/components/layout/header/Header";
import Sidebar from "@/components/layout/sidebar/Sidebar";
import type { NavItem } from "@/config/navigation";
import styles from "./dashboard.module.css";

interface DashboardProps {
  nav: NavItem[];
  profileHref: string;
  children: ReactNode;
}

/** Каркас кабинета: меню слева, верхняя панель и контент справа */
const Dashboard = ({ nav, profileHref, children }: DashboardProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.dashboard}>
      <Sidebar items={nav} profileHref={profileHref} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className={styles.main}>
        <Header items={nav} profileHref={profileHref} onMenuClick={() => setMenuOpen(true)} />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default Dashboard;
