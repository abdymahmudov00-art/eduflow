"use client";

import { useState, type FormEvent } from "react";
import GroupHistory from "@/components/page/shared/group-history/GroupHistory";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FormSection } from "@/components/ui/form-layout/FormLayout";
import type { Group, Student, StudentUpdate } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";

interface TransferFormProps {
  student: Student;
  groups: Group[];
  onSubmit: (data: StudentUpdate) => Promise<void>;
  onCancel: () => void;
}

/** Перевод студента в другую группу + смена номера. История переводов пишется на сервере */
const TransferForm = ({ student, groups, onSubmit, onCancel }: TransferFormProps) => {
  const [groupId, setGroupId] = useState(student.group_id ? String(student.group_id) : "");
  const [number, setNumber] = useState(student.student_number);
  const [numberError, setNumberError] = useState<string>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const groupNames = new Map(groups.map((g) => [g.id, `${g.name} · ${g.course_name}`]));
  const nextGroupId = groupId ? Number(groupId) : null;
  const changed = nextGroupId !== student.group_id || number.trim() !== student.student_number;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = number.trim();
    if (!trimmed || trimmed.length > 30) {
      setNumberError("От 1 до 30 символов");
      return;
    }
    setNumberError(undefined);
    const data: StudentUpdate = {};
    if (nextGroupId !== student.group_id) data.group_id = nextGroupId;
    if (trimmed !== student.student_number) data.student_number = trimmed;
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(data);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <Alert>{serverError}</Alert>}
      <FormGrid>
        <Select
          label="Группа"
          placeholder="Без группы"
          options={groups.map((g) => ({ value: String(g.id), label: `${g.name} · ${g.course_name}` }))}
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          hint={nextGroupId !== student.group_id ? "Будет записан перевод в историю" : undefined}
        />
        <Input
          label="Номер студента"
          value={number}
          error={numberError}
          onChange={(e) => setNumber(e.target.value)}
        />
      </FormGrid>

      <FormSection title="История групп">
        <GroupHistory items={student.group_history ?? []} groupNames={groupNames} />
      </FormSection>

      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting} disabled={!changed}>
          {nextGroupId !== student.group_id ? "Перевести" : "Сохранить"}
        </Button>
      </FormActions>
    </form>
  );
};

export default TransferForm;
