"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { Group, GroupInput } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";

interface GroupFormProps {
  group?: Group;
  onSubmit: (data: GroupInput) => Promise<void>;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof GroupInput, string>>;

const GroupForm = ({ group, onSubmit, onCancel }: GroupFormProps) => {
  const [name, setName] = useState(group?.name ?? "");
  const [courseName, setCourseName] = useState(group?.course_name ?? "");
  const [startDate, setStartDate] = useState(group?.start_date ?? "");
  const [endDate, setEndDate] = useState(group?.end_date ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: Errors = {};
    if (!name.trim()) next.name = "Укажите название";
    else if (name.length > 100) next.name = "Не больше 100 символов";
    if (!courseName.trim()) next.course_name = "Укажите курс";
    else if (courseName.length > 150) next.course_name = "Не больше 150 символов";
    if (!startDate) next.start_date = "Укажите дату начала";
    if (endDate && startDate && endDate < startDate) next.end_date = "Не раньше даты начала";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        name: name.trim(),
        course_name: courseName.trim(),
        start_date: startDate,
        end_date: endDate || null,
      });
    } catch (err) {
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
            label="Название группы"
            required
            placeholder="Группа A-1"
            value={name}
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
          />
        </FullRow>
        <FullRow>
          <Input
            label="Курс"
            required
            placeholder="Python Basic"
            value={courseName}
            error={errors.course_name}
            onChange={(e) => setCourseName(e.target.value)}
          />
        </FullRow>
        <Input
          label="Дата начала"
          required
          type="date"
          value={startDate}
          error={errors.start_date}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="Дата окончания"
          type="date"
          value={endDate}
          error={errors.end_date}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {group ? "Сохранить" : "Создать"}
        </Button>
      </FormActions>
    </form>
  );
};

export default GroupForm;
