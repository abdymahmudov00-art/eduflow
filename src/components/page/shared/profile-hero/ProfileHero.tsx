import type { ReactNode } from "react";
import Avatar from "@/components/ui/avatar/Avatar";
import styles from "./profile-hero.module.css";

export interface ProfileStat {
  label: string;
  value: ReactNode;
}

interface ProfileHeroProps {
  name: string;
  subtitle?: string;
  badges?: ReactNode;
  stats?: ProfileStat[];
  photoUrl?: string | null;
}

/** Шапка профиля: градиентная обложка, аватар, имя, бейджи и цифры */
const ProfileHero = ({ name, subtitle, badges, stats, photoUrl }: ProfileHeroProps) => (
  <section className={styles.hero}>
    <div className={styles.cover} aria-hidden="true" />
    <div className={styles.body}>
      <div className={styles.avatar}>
        <Avatar name={name} size={84} src={photoUrl} />
      </div>
      <div className={styles.info}>
        <h1 className={styles.name}>{name}</h1>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
        {badges && <div className={styles.badges}>{badges}</div>}
      </div>
      {stats && stats.length > 0 && (
        <dl className={styles.stats}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <dd>{stat.value}</dd>
              <dt>{stat.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </div>
  </section>
);

export default ProfileHero;
