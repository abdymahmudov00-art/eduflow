import Icon from "@/components/ui/icon/Icon";
import styles from "./promo-banner.module.css";

/** Баннер внизу главной студента: «Всё для учёбы в одном месте» с шапочкой выпускника */
const PromoBanner = () => (
  <section className={styles.banner}>
    <span className={styles.spark}>
      <Icon name="sparkle" size={22} />
    </span>
    <div className={styles.copy}>
      <strong className={styles.title}>Всё для учёбы в одном месте</strong>
      <span className={styles.text}>Расписание, оплаты, оценки и посещаемость</span>
    </div>
    <svg className={styles.cap} viewBox="0 0 120 90" aria-hidden="true">
      <defs>
        <linearGradient id="capTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#93c5fd" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="capBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d4ed8" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
      <path d="M30 42v20c0 8 14 14 30 14s30-6 30-14V42L60 54z" fill="url(#capBase)" />
      <path d="M60 14 4 36l56 22 56-22z" fill="url(#capTop)" />
      <path d="M60 14 4 36l56 22 56-22z" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
      <path d="M60 36 98 44v24" fill="none" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
      <circle cx="98" cy="72" r="4" fill="#bfdbfe" />
      <circle cx="60" cy="36" r="3" fill="#ffffff" />
    </svg>
  </section>
);

export default PromoBanner;
