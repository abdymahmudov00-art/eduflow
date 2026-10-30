"use client";

import AsyncState from "@/components/ui/async-state/AsyncState";
import Card from "@/components/ui/card/Card";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ProgressBar from "@/components/ui/progress-bar/ProgressBar";
import StatCard from "@/components/ui/stat-card/StatCard";
import { ApiError, studyApi } from "@/lib/api";
import { toNumber } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "../student.module.css";

/** 503 = портал оценок ещё не подключён — это не ошибка, а пустое состояние */
async function loadStudy() {
  try {
    return await studyApi.me();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 503 || err.status === 404)) return null;
    throw err;
  }
}

const percent = (value: string | null) => (value === null ? "—" : `${Math.round(toNumber(value))}%`);

/** Учебный процесс: посещаемость, прогресс по темам и оценки */
export default function StudentStudyPage() {
  const { data, loading, error, reload } = useFetch(loadStudy);

  return (
    <>
      <PageHeader
        kicker="Учебный процесс"
        title="Оценки и посещаемость"
        description="Данные приходят из учебного портала. Здесь только ваша академическая информация."
      />
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {!data ? (
          <EmptyState
            icon="book"
            title="Портал оценок ещё не подключён"
            description="Баллы, посещения и пропуски появятся, как только сервер подключат к учебному порталу."
          />
        ) : (
          <div className={styles.stack}>
            <div className={styles.statGrid}>
              <StatCard
                label="Посещаемость"
                value={percent(data.attendance_percent)}
                hint={`${data.attended_lessons} из ${data.held_lessons} занятий`}
              />
              <StatCard
                label="Пройдено тем"
                value={percent(data.progress_percent)}
                hint={
                  data.total_topics !== null ? `${data.completed_topics ?? 0} из ${data.total_topics} тем` : undefined
                }
              />
              <StatCard
                label="Средний балл"
                value={data.average_grade === null ? "—" : toNumber(data.average_grade).toFixed(1)}
                hint={`оценок: ${data.grades.length}`}
              />
            </div>

            {data.progress_percent !== null && (
              <Card title="Прогресс по программе">
                <ProgressBar value={toNumber(data.progress_percent)} label="Пройдено тем" />
              </Card>
            )}

            <Card title="Оценки">
              {data.grades.length === 0 ? (
                <p className={styles.empty}>Оценок пока нет</p>
              ) : (
                <div className={styles.grades}>
                  {data.grades.map((grade, i) => (
                    <span key={i} className={styles.grade}>
                      {grade}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </AsyncState>
    </>
  );
}
