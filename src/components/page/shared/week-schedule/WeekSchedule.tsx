import type { ReactNode } from "react";
import Icon from "@/components/ui/icon/Icon";
import type { Schedule } from "@/lib/api/types";
import { formatTime } from "@/lib/format";
import { WEEKDAYS } from "@/lib/labels";
import styles from "./week-schedule.module.css";

interface WeekScheduleProps {
  lessons: Schedule[];
  /** Кнопки у занятия (для админа) */
  renderActions?: (lesson: Schedule) => ReactNode;
}

/** Расписание по дням недели: только дни, в которые есть занятия */
const WeekSchedule = ({ lessons, renderActions }: WeekScheduleProps) => {
  const days = WEEKDAYS.map((day) => ({
    ...day,
    lessons: lessons
      .filter((l) => l.weekday === day.value)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter((day) => day.lessons.length > 0);

  return (
    <div className={styles.week}>
      {days.map((day) => (
        <section key={day.value} className={styles.day}>
          <div className={styles.dayHead}>
            <span className={styles.short}>{day.short}</span>
            <span className={styles.dayName}>{day.label}</span>
          </div>
          <ul className={styles.lessons}>
            {day.lessons.map((lesson) => (
              <li key={lesson.id} className={styles.lesson}>
                <span className={styles.time}>
                  <Icon name="clock" size={15} />
                  {formatTime(lesson.start_time)} — {formatTime(lesson.end_time)}
                </span>
                <span className={styles.title}>{lesson.title}</span>
                {renderActions && <span className={styles.actions}>{renderActions(lesson)}</span>}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default WeekSchedule;
