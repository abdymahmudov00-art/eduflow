import Avatar from "@/components/ui/avatar/Avatar";
import Badge from "@/components/ui/badge/Badge";
import Icon from "@/components/ui/icon/Icon";
import Panel from "@/components/ui/panel/Panel";
import type { Group } from "@/lib/api/types";
import { formatDate } from "@/lib/format";
import styles from "./group-panel.module.css";

/** Карточка «Моя группа» на главной студента */
const GroupPanel = ({ group }: { group: Group | null }) => (
  <Panel
    title="Моя группа"
    footer={
      group ? (
        <>
          <span className={styles.dates}>
            <Icon name="calendar" size={15} />
            {formatDate(group.start_date)} — {group.end_date ? formatDate(group.end_date) : "…"}
          </span>
          <Badge tone="info">Учусь</Badge>
        </>
      ) : undefined
    }
  >
    {group ? (
      <div className={styles.group}>
        <Avatar name={group.course_name} size={44} />
        <div className={styles.text}>
          <span className={styles.course}>{group.course_name}</span>
          <span className={styles.name}>{group.name}</span>
        </div>
      </div>
    ) : (
      <p className={styles.empty}>Вы пока не добавлены в группу. Обратитесь к администратору.</p>
    )}
  </Panel>
);

export default GroupPanel;
