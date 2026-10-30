"use client";

import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { FormActions } from "@/components/ui/form-layout/FormLayout";
import { getErrorMessage } from "@/lib/errors";
import styles from "./password-form.module.css";

interface PasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
}

/** Смена пароля: новый пароль + повтор */
const PasswordForm = ({ onSubmit }: PasswordFormProps) => {
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [errors, setErrors] = useState<{ password?: string; repeat?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8 || password.length > 128) next.password = "От 8 до 128 символов";
    if (repeat !== password) next.repeat = "Пароли не совпадают";
    setErrors(next);
    setSuccess(false);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(password);
      setPassword("");
      setRepeat("");
      setSuccess(true);
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {serverError && <Alert>{serverError}</Alert>}
      {success && (
        <Alert tone="success" onClose={() => setSuccess(false)}>
          Пароль изменён. Используйте его при следующем входе
        </Alert>
      )}
      <Input
        label="Новый пароль"
        type="password"
        autoComplete="new-password"
        value={password}
        error={errors.password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        label="Повторите пароль"
        type="password"
        autoComplete="new-password"
        value={repeat}
        error={errors.repeat}
        onChange={(e) => setRepeat(e.target.value)}
      />
      <FormActions>
        <Button type="submit" icon="lock" loading={submitting}>
          Сменить пароль
        </Button>
      </FormActions>
    </form>
  );
};

export default PasswordForm;
