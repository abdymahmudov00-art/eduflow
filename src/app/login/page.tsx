import type { Metadata } from "next";
import Footer from "@/components/layout/footer/Footer";
import GuestOnly from "@/components/layout/guest-only/GuestOnly";
import LoginForm from "@/components/page/login/login-form/LoginForm";
import Icon from "@/components/ui/icon/Icon";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <GuestOnly>
      <div className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.logo}>
            <span className={styles.mark}>
              <Icon name="sparkle" size={20} />
            </span>
            EduFlow
          </div>
          <div className={styles.card}>
            <h1 className={styles.title}>С возвращением</h1>
            <p className={styles.subtitle}>Войдите с логином и паролем, которые выдал администратор</p>
            <LoginForm />
          </div>
        </div>
        <Footer />
      </div>
    </GuestOnly>
  );
}
