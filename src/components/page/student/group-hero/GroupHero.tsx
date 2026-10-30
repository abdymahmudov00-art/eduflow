import Badge from "@/components/ui/badge/Badge";
import Icon from "@/components/ui/icon/Icon";
import type { Group } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import styles from "./group-hero.module.css";

/** Большая карточка «Текущая группа» на главной студента */
const GroupHero = ({ group }: { group: Group | null }) => (
  <section className={styles.hero}>
    <span className={styles.icon}>
      <Icon name="idcard" size={30} />
    </span>
    <div className={styles.copy}>
      <span className={styles.eyebrow}>Текущая группа</span>
      {group ? (
        <>
          <h1 className={styles.name}>{group.name}</h1>
          <p className={styles.meta}>
            С {formatDate(group.start_date)}
            <span className={styles.dot}>•</span>
            {group.course_name}
          </p>
        </>
      ) : (
        <>
          <h1 className={styles.name}>Не назначена</h1>
          <p className={styles.meta}>Администратор ещё не добавил вас в группу</p>
        </>
      )}
    </div>
    {group && <Badge tone="success">Активная</Badge>}
  </section>
);

export default GroupHero;
