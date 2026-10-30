import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "@/components/ui/icon/Icon";
import styles from "./panel.module.css";

interface PanelProps {
  title: string;
  /** Если указан — заголовок становится ссылкой со стрелкой */
  href?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Небольшая карточка для главной: заголовок, содержимое, низ */
const Panel = ({ title, href, children, footer }: PanelProps) => (
  <section className={styles.panel}>
    {href ? (
      <Link href={href} className={styles.titleLink}>
        <span className={styles.title}>{title}</span>
        <Icon name="chevron" size={16} />
      </Link>
    ) : (
      <span className={styles.title}>{title}</span>
    )}
    <div className={styles.body}>{children}</div>
    {footer && <div className={styles.footer}>{footer}</div>}
  </section>
);

export default Panel;
