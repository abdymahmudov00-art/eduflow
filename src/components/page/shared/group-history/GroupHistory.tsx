import Badge from "@/components/ui/badge/Badge";
import type { GroupHistoryItem } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import { GROUP_HISTORY_LABELS } from "@/lib/labels";
import styles from "./group-history.module.css";

interface GroupHistoryProps {
  items: GroupHistoryItem[];
  /** id группы → название (что неизвестно — покажем «Группа №id») */
  groupNames: Map<number, string>;
}

/** История групп: поступление, переводы и текущая группа */
const GroupHistory = ({ items, groupNames }: GroupHistoryProps) => {
  if (items.length === 0) return <p className={styles.empty}>Истории групп пока нет</p>;

  // Новые сверху: текущая группа — первой
  const sorted = [...items].sort((a, b) => (b.from_date ?? "").localeCompare(a.from_date ?? "") || b.id - a.id);

  return (
    <ol className={styles.list}>
      {sorted.map((item) => {
        const current = item.to_date === null;
        return (
          <li key={item.id} className={`${styles.item} ${current ? styles.current : ""}`}>
            <span className={styles.dot} aria-hidden="true" />
            <div className={styles.body}>
              <div className={styles.head}>
                <strong className={styles.name}>{groupNames.get(item.group_id) ?? `Группа №${item.group_id}`}</strong>
                <Badge tone={item.kind === "transfer" ? "info" : "neutral"}>{GROUP_HISTORY_LABELS[item.kind]}</Badge>
                {current && <Badge tone="success">Текущая</Badge>}
              </div>
              <span className={styles.period}>
                {item.from_date ? `с ${formatDate(item.from_date)}` : "—"}
                {item.to_date ? ` по ${formatDate(item.to_date)}` : " · по настоящее время"}
              </span>
              {item.reason && <span className={styles.reason}>{item.reason}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default GroupHistory;
