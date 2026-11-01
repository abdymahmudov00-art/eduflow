"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import DayPicker from "@/components/ui/day-picker/DayPicker";
import Input from "@/components/ui/input/Input";
import TimeInput from "@/components/ui/time-input/TimeInput";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { Schedule, ScheduleInput, Weekday } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";

interface ScheduleFormProps {
  groupId: number;
  /** Есть — редактируем одно занятие (один день); нет — добавляем сразу на несколько дней */
  lesson?: Schedule;
  /** Одно занятие на каждый выбранный день */
  onSubmit: (data: ScheduleInput[]) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<"title" | "days" | "start" | "end", string>>;

/** Занятие в расписании группы: название, дни недели, время */
const ScheduleForm = ({ groupId, lesson, onSubmit, onCancel }: ScheduleFormProps) => {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [days, setDays] = useState<Weekday[]>(lesson ? [lesson.weekday] : []);
  const [start, setStart] = useState(lesson?.start_time.slice(0, 5) ?? "");
  const [end, setEnd] = useState(lesson?.end_time.slice(0, 5) ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearError = (field: keyof Errors) => setErrors((prev) => ({ ...prev, [field]: undefined }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Errors = {};
    if (!title.trim()) next.title = "Укажите занятие";
    else if (title.length > 150) next.title = "Не больше 150 символов";
    if (days.length === 0) next.days = "Выберите хотя бы один день";
    if (!start) next.start = "Укажите время";
    if (!end) next.end = "Укажите время";
    else if (start && end <= start) next.end = "Позже начала";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(
        days.map((weekday) => ({
          group_id: groupId,
          title: title.trim(),
          weekday,
          start_time: `${start}:00`,
          end_time: `${end}:00`,
        })),
      );
    } catch (err) {
      // Например, сервер не дал поставить пересекающееся занятие
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitText = lesson
    ? "Сохранить"
    : days.length > 1
      ? `Добавить на ${days.length} дн.`
      : "Добавить занятие";

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div style={{ marginBottom: 16 }}>
          <Alert>{serverError}</Alert>
        </div>
      )}
      <FormGrid>
        <FullRow>
          <Input
            label="Занятие"
            required
            placeholder="Например: Python — практика"
            value={title}
            error={errors.title}
            onChange={(e) => {
              setTitle(e.target.value);
              clearError("title");
            }}
          />
        </FullRow>
        <FullRow>
          <DayPicker
            label={lesson ? "День недели" : "Дни недели"}
            required
            multiple={!lesson}
            value={days}
            error={errors.days}
            onChange={(next) => {
              setDays(next);
              clearError("days");
            }}
          />
        </FullRow>
        <TimeInput
          label="Начало"
          required
          value={start}
          error={errors.start}
          onChange={(v) => {
            setStart(v);
            clearError("start");
          }}
        />
        <TimeInput
          label="Конец"
          required
          value={end}
          error={errors.end}
          onChange={(v) => {
            setEnd(v);
            clearError("end");
          }}
        />
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {submitText}
        </Button>
      </FormActions>
    </form>
  );
};

export default ScheduleForm;
