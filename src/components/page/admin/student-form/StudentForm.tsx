"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FormSection } from "@/components/ui/form-layout/FormLayout";
import type { Group, StudentCreate } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import styles from "./student-form.module.css";

interface StudentFormProps {
  groups: Group[];
  onSubmit: (data: StudentCreate) => Promise<void>;
  onCancel: () => void;
}

interface AccountErrors {
  username?: string;
  password?: string;
  student_number?: string;
}

const StudentForm = ({ groups, onSubmit, onCancel }: StudentFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [groupId, setGroupId] = useState("");
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: AccountErrors = {};
    if (username.trim().length < 3 || username.trim().length > 50) next.username = "От 3 до 50 символов";
    if (password.length < 8 || password.length > 128) next.password = "От 8 до 128 символов";
    if (!studentNumber.trim()) next.student_number = "Укажите номер";
    else if (studentNumber.length > 30) next.student_number = "Не больше 30 символов";
    setAccountErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit({
        username: username.trim(),
        password,
        student_number: studentNumber.trim(),
        group_id: groupId ? Number(groupId) : null,
      });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <Alert>{serverError}</Alert>}

      <FormSection title="Учётная запись">
        <FormGrid>
          <Input
            label="Логин"
            required
            autoComplete="off"
            value={username}
            error={accountErrors.username}
            onChange={(e) => { setUsername(e.target.value); setAccountErrors((p) => ({ ...p, username: undefined })); }}
          />
          <Input
            label="Пароль"
            required
            type="password"
            autoComplete="new-password"
            value={password}
            error={accountErrors.password}
            onChange={(e) => { setPassword(e.target.value); setAccountErrors((p) => ({ ...p, password: undefined })); }}
          />
          <Input
            label="Номер студента"
            required
            placeholder="ST-2026-01"
            value={studentNumber}
            error={accountErrors.student_number}
            onChange={(e) => { setStudentNumber(e.target.value); setAccountErrors((p) => ({ ...p, student_number: undefined })); }}
          />
          <Select
            label="Группа"
            placeholder="Без группы"
            options={groups.map((g) => ({ value: String(g.id), label: `${g.name} · ${g.course_name}` }))}
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            hint="Перевести в другую группу можно позже"
          />
        </FormGrid>
      </FormSection>

      <p className={styles.note}>
        Личные данные студент заполнит сам в разделе «Личная информация». Анкета придёт вам на
        проверку во вкладку «Анкеты на проверке».
      </p>

      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          Создать студента
        </Button>
      </FormActions>
    </form>
  );
};

export default StudentForm;
