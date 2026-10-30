import type { Group, Student } from "@/lib/api/types";
import { formatDate, fullName } from "@/lib/format";
import styles from "./profile-card.module.css";

interface ProfileCardProps {
  student: Student;
  group: Group | null;
}

const ProfileCard = ({ student, group }: ProfileCardProps) => {
  const info = student.personal_info;
  const initials = info ? `${info.first_name[0] ?? ""}${info.last_name[0] ?? ""}` : "?";

  return (
    <section className={styles.card}>
      <div className={styles.avatar} aria-hidden="true">
        {initials.toUpperCase()}
      </div>
      <div className={styles.main}>
        <h2 className={styles.name}>{fullName(info)}</h2>
        <span className={styles.number}>{student.student_number}</span>
      </div>
      <div className={styles.group}>
        {group ? (
          <>
            <span className={styles.groupName}>{group.name}</span>
            <span className={styles.course}>{group.course_name}</span>
            <span className={styles.dates}>
              {formatDate(group.start_date)} — {formatDate(group.end_date)}
            </span>
          </>
        ) : (
          <span className={styles.course}>Вы пока не добавлены в группу</span>
        )}
      </div>
    </section>
  );
};

export default ProfileCard;
