"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FormSection } from "@/components/ui/form-layout/FormLayout";
import PersonalInfoFields, {
  EMPTY_PERSONAL_INFO,
  toPersonalInfoInput,
  validatePersonalInfo,
  type PersonalInfoErrors,
  type PersonalInfoValues,
} from "@/components/page/shared/personal-info-fields/PersonalInfoFields";
import type { Group, StudentCreate } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";

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
  const [info, setInfo] = useState<PersonalInfoValues>(EMPTY_PERSONAL_INFO);
  const [accountErrors, setAccountErrors] = useState<AccountErrors>({});
  const [infoErrors, setInfoErrors] = useState<PersonalInfoErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: AccountErrors = {};
    if (username.trim().length < 3 || username.trim().length > 50) next.username = "От 3 до 50 символов";
    if (password.length < 8 || password.length > 128) next.password = "От 8 до 128 символов";
    if (!studentNumber.trim()) next.student_number = "Укажите номер";
    else if (studentNumber.length > 30) next.student_number = "Не больше 30 символов";
    const nextInfo = validatePersonalInfo(info);
    setAccountErrors(next);
    setInfoErrors(nextInfo);
    return Object.keys(next).length === 0 && Object.keys(nextInfo).length === 0;
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
        personal_info: toPersonalInfoInput(info),
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
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="Пароль"
            required
            type="password"
            autoComplete="new-password"
            value={password}
            error={accountErrors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Номер студента"
            required
            placeholder="ST-2026-01"
            value={studentNumber}
            error={accountErrors.student_number}
            onChange={(e) => setStudentNumber(e.target.value)}
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

      <FormSection title="Личные данные">
        <PersonalInfoFields
          values={info}
          errors={infoErrors}
          onChange={(field, value) => {
            setInfo((prev) => ({ ...prev, [field]: value }));
            setInfoErrors((prev) => ({ ...prev, [field]: undefined }));
          }}
        />
      </FormSection>

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
