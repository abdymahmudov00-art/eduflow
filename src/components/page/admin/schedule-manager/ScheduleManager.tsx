"use client";

import { useState } from "react";
import ScheduleForm from "@/components/page/admin/schedule-form/ScheduleForm";
import WeekSchedule from "@/components/page/shared/week-schedule/WeekSchedule";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import { schedulesApi } from "@/lib/api";
import type { Group, Schedule } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { weekdayLabel } from "@/lib/labels";
import styles from "./schedule-manager.module.css";

interface ScheduleManagerProps {
  group: Group;
  /** Перезагрузить группы после изменения */
  onChanged: () => void;
}

/** Расписание группы для админа: просмотр, добавление, правка, удаление */
const ScheduleManager = ({ group, onChanged }: ScheduleManagerProps) => {
  const [mode, setMode] = useState<"list" | "add" | Schedule>("list");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lessons = group.schedules ?? [];

  const handleDelete = async (lesson: Schedule) => {
    setDeletingId(lesson.id);
    setError(null);
    try {
      await schedulesApi.remove(lesson.id);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  if (mode !== "list") {
    const lesson = mode === "add" ? undefined : mode;
    return (
      <ScheduleForm
        groupId={group.id}
        lesson={lesson}
        onCancel={() => setMode("list")}
        onSubmit={async (values) => {
          if (lesson) {
            await schedulesApi.update(lesson.id, values[0]);
            setMode("list");
            onChanged();
            return;
          }
          // Создаём по занятию на каждый день; ошибки (например, пересечение) собираем по дням
          const failed: string[] = [];
          for (const value of values) {
            try {
              await schedulesApi.create(value);
            } catch (err) {
              failed.push(`${weekdayLabel(value.weekday)}: ${getErrorMessage(err)}`);
            }
          }
          if (failed.length === values.length) {
            // Ничего не добавилось — оставляем форму открытой с ошибкой
            throw new Error(failed.join("; "));
          }
          setMode("list");
          onChanged();
          if (failed.length > 0) setError(`Не все дни добавлены. ${failed.join("; ")}`);
        }}
      />
    );
  }

  return (
    <div className={styles.manager}>
      {error && <Alert onClose={() => setError(null)}>{error}</Alert>}
      {lessons.length === 0 ? (
        <p className={styles.empty}>Занятий пока нет. Добавьте первое — студенты группы сразу его увидят.</p>
      ) : (
        <WeekSchedule
          lessons={lessons}
          renderActions={(lesson) => (
            <>
              <Button variant="secondary" size="sm" onClick={() => setMode(lesson)}>
                Изменить
              </Button>
              <Button
                variant="dangerOutline"
                size="sm"
                loading={deletingId === lesson.id}
                onClick={() => handleDelete(lesson)}
              >
                Удалить
              </Button>
            </>
          )}
        />
      )}
      <div className={styles.footer}>
        <Button icon="plus" onClick={() => setMode("add")}>
          Добавить занятие
        </Button>
      </div>
    </div>
  );
};

export default ScheduleManager;
