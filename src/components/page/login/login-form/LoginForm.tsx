"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Alert from "@/components/ui/alert/Alert";
import Button from "@/components/ui/button/Button";
import Input from "@/components/ui/input/Input";
import { homePathFor, useAuth } from "@/lib/auth/useAuth";
import { getErrorMessage } from "@/lib/errors";
import styles from "./login-form.module.css";

const LoginForm = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Введите логин и пароль");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const session = await login(username.trim(), password);
      router.replace(homePathFor(session.role));
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && <Alert>{error}</Alert>}
      <Input
        label="Логин"
        name="username"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoFocus
      />
      <Input
        label="Пароль"
        name="password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" fullWidth loading={submitting}>
        Войти
      </Button>
    </form>
  );
};

export default LoginForm;
