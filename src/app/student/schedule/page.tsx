"use client";

import WeekSchedule from "@/components/page/shared/week-schedule/WeekSchedule";
import AsyncState from "@/components/ui/async-state/AsyncState";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PageHeader from "@/components/ui/page-header/PageHeader";
import { groupsApi } from "@/lib/api";
import { isNotFound } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "../student.module.css";

async function loadGroup() {
  try {
    return await groupsApi.my();
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Расписание своей группы (приходит вместе с группой) */
export default function StudentSchedulePage() {
  const { data: group, loading, error, reload } = useFetch(loadGroup);

  return (
    <>
      <PageHeader
        kicker="Расписание"
        title="Дни и время занятий"
        description="Постоянное расписание вашей группы. При переводе здесь появится расписание новой группы."
      />
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {!group ? (
          <EmptyState
            icon="layers"
            title="Вы пока не в группе"
            description="Расписание появится, когда администратор добавит вас в группу."
          />
        ) : (
          <>
            <div className={styles.banner}>
              Группа: <b>{group.name}</b> · Курс: <b>{group.course_name}</b> · Период:{" "}
              <b>
                {formatDate(group.start_date)} — {group.end_date ? formatDate(group.end_date) : "…"}
              </b>
            </div>
            {(group.schedules ?? []).length === 0 ? (
              <EmptyState
                icon="calendar"
                title="Расписание ещё не составлено"
                description="Администратор пока не добавил занятия для вашей группы."
              />
            ) : (
              <WeekSchedule lessons={group.schedules} />
            )}
          </>
        )}
      </AsyncState>
    </>
  );
}
