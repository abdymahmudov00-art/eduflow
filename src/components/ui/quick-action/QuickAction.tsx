import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/icon/Icon";
import styles from "./quick-action.module.css";

interface QuickActionProps {
  href: string;
  icon: IconName;
  title: string;
  description: string;
  tone?: "violet" | "red" | "blue" | "amber" | "green";
}

/** Плитка быстрого действия: цветная иконка + заголовок + подпись */
const QuickAction = ({ href, icon, title, description, tone = "violet" }: QuickActionProps) => (
  <Link href={href} className={styles.action}>
    <span className={`${styles.icon} ${styles[tone]}`}>
      <Icon name={icon} size={20} />
    </span>
    <span className={styles.text}>
      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>
    </span>
  </Link>
);

export default QuickAction;
