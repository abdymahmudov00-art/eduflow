import styles from "./layout.module.css";

/** Корневая обёртка. Шапка и меню живут внутри кабинета (components/layout/dashboard) */
const Layout = ({ children }: { children: React.ReactNode }) => {
  return <div className={styles.layout}>{children}</div>;
};

export default Layout;
