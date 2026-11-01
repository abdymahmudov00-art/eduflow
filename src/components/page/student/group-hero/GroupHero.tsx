import Link from "next/link";
import Badge from "@/components/ui/badge/Badge";
import Icon from "@/components/ui/icon/Icon";
import type { Group } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import styles from "./group-hero.module.css";

/** Большая карточка «Текущая группа» на главной студента */
const GroupHero = ({ group }: { group: Group | null }) => (
  <section className={styles.hero}>
    <span className={styles.eyebrow}>Текущая группа</span>
    <span className={styles.icon}>
      <Icon name="users" size={30} />
    </span>
    {group ? (
      <>
        <h1 className={styles.name}>{group.name}</h1>
        <span className={styles.badge}>
          <Badge tone="success">Активная</Badge>
        </span>
        <p className={styles.meta}>
          С {formatDate(group.start_date)}
          <span className={styles.dot}>•</span>
          {group.course_name}
        </p>
        <Link href="/student/schedule" className={styles.link} aria-label="Расписание группы">
          <Icon name="chevron" size={20} />
        </Link>
      </>
    ) : (
      <>
        <h1 className={styles.name}>Не назначена</h1>
        <p className={styles.meta}>Администратор ещё не добавил вас в группу</p>
      </>
    )}
  </section>
);

export default GroupHero;
