import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import styles from "./section-tile.module.css";

interface SectionTileProps {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  tone?: "violet" | "green" | "amber" | "pink" | "blue";
  /** Маленькая плашка, например «скоро» */
  tag?: string;
}

/** Большая плитка раздела кабинета со стрелкой ↗ */
const SectionTile = ({ href, icon, title, description, tone = "violet", tag }: SectionTileProps) => (
  <Link href={href} className={styles.tile}>
    <span className={`${styles.icon} ${styles[tone]}`}>
      <Icon name={icon} size={24} />
    </span>
    <span className={styles.title}>{title}</span>
    <span className={styles.description}>{description}</span>
    {tag && <span className={styles.tag}>{tag}</span>}
    <Icon name="arrowUpRight" size={22} className={styles.arrow} />
  </Link>
);

export default SectionTile;
