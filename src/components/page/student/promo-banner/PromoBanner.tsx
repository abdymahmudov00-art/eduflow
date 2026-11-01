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
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="capBase" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b21b6" />
          <stop offset="1" stopColor="#2e1065" />
        </linearGradient>
      </defs>
      <path d="M30 42v20c0 8 14 14 30 14s30-6 30-14V42L60 54z" fill="url(#capBase)" />
      <path d="M60 14 4 36l56 22 56-22z" fill="url(#capTop)" />
      <path d="M60 14 4 36l56 22 56-22z" fill="none" stroke="rgba(221,214,254,0.45)" strokeWidth="1" />
      <path d="M60 36 98 44v24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" />
      <circle cx="98" cy="72" r="4" fill="#c4b5fd" />
      <circle cx="60" cy="36" r="3" fill="#ede9fe" />
    </svg>
  </section>
);

export default PromoBanner;
