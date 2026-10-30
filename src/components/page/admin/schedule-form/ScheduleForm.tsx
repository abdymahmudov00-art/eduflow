"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { Schedule, ScheduleInput, Weekday } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { WEEKDAYS } from "@/lib/labels";

interface ScheduleFormProps {
  groupId: number;
  lesson?: Schedule;
  onSubmit: (data: ScheduleInput) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<"title" | "start" | "end", string>>;

/** Занятие в расписании группы: название, день, время */
const ScheduleForm = ({ groupId, lesson, onSubmit, onCancel }: ScheduleFormProps) => {
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [weekday, setWeekday] = useState<Weekday>(lesson?.weekday ?? "Monday");
  const [start, setStart] = useState(lesson?.start_time.slice(0, 5) ?? "");
  const [end, setEnd] = useState(lesson?.end_time.slice(0, 5) ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Errors = {};
    if (!title.trim()) next.title = "Укажите занятие";
    else if (title.length > 150) next.title = "Не больше 150 символов";
    if (!start) next.start = "Укажите время";
    if (!end) next.end = "Укажите время";
    else if (start && end <= start) next.end = "Позже начала";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        group_id: groupId,
        title: title.trim(),
        weekday,
        start_time: `${start}:00`,
        end_time: `${end}:00`,
      });
    } catch (err) {
      // Например, сервер не дал поставить пересекающееся занятие
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
            onChange={(e) => setTitle(e.target.value)}
          />
        </FullRow>
        <FullRow>
          <Select
            label="День недели"
            options={WEEKDAYS.map((d) => ({ value: d.value, label: d.label }))}
            value={weekday}
            onChange={(e) => setWeekday(e.target.value as Weekday)}
          />
        </FullRow>
        <Input label="Начало" required type="time" value={start} error={errors.start} onChange={(e) => setStart(e.target.value)} />
        <Input label="Конец" required type="time" value={end} error={errors.end} onChange={(e) => setEnd(e.target.value)} />
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {lesson ? "Сохранить" : "Добавить занятие"}
        </Button>
      </FormActions>
    </form>
  );
};

export default ScheduleForm;
