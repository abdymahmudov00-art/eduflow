"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/ui/checkbox/Checkbox";
import Input from "@/components/ui/input/Input";
import Select from "@/components/ui/select/Select";
import { FormActions, FormGrid, FullRow } from "@/components/ui/form-layout/FormLayout";
import type { User, UserCreate, UserRole, UserUpdate } from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { ROLE_LABELS } from "@/lib/labels";

type UserFormProps =
  | { user?: undefined; onSubmit: (data: UserCreate) => Promise<void>; onCancel: () => void }
  | { user: User; onSubmit: (data: UserUpdate) => Promise<void>; onCancel: () => void };

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as UserRole[]).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

const UserForm = (props: UserFormProps) => {
  const { user, onCancel } = props;
  const isEdit = Boolean(user);

  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? "student");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    const name = username.trim();
    if (name.length < 3 || name.length > 50) next.username = "От 3 до 50 символов";
    if (!isEdit || password) {
      if (password.length < 8 || password.length > 128) next.password = "От 8 до 128 символов";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      if (props.user) {
        // Отправляем только изменённые поля
        const data: UserUpdate = {};
        if (username.trim() !== props.user.username) data.username = username.trim();
        if (password) data.password = password;
        if (isActive !== props.user.is_active) data.is_active = isActive;
        await props.onSubmit(data);
      } else {
        await props.onSubmit({ username: username.trim(), password, role });
      }
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
            label="Логин"
            required
            autoComplete="off"
            value={username}
            error={errors.username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FullRow>
        <Input
          label={isEdit ? "Новый пароль" : "Пароль"}
          required={!isEdit}
          type="password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          hint={isEdit ? "Оставьте пустым, чтобы не менять" : undefined}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isEdit ? (
          <Input label="Роль" value={ROLE_LABELS[role]} disabled hint="Роль после создания не меняется" />
        ) : (
          <Select
            label="Роль"
            options={ROLE_OPTIONS}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            hint="Студентов удобнее создавать в разделе «Студенты»"
          />
        )}
        {isEdit && (
          <FullRow>
            <Checkbox
              label="Аккаунт активен (может входить в систему)"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
          </FullRow>
        )}
      </FormGrid>
      <FormActions>
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Отмена
        </Button>
        <Button type="submit" loading={submitting}>
          {isEdit ? "Сохранить" : "Создать"}
        </Button>
      </FormActions>
    </form>
  );
};

export default UserForm;
