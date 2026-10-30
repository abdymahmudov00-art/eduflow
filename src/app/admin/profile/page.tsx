"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PasswordForm from "@/components/page/admin/password-form/PasswordForm";
import InfoList from "@/components/page/shared/info-list/InfoList";
import ProfileHero from "@/components/page/shared/profile-hero/ProfileHero";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import { paymentsApi, studentsApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import { useFetch } from "@/lib/hooks/useFetch";
import { ROLE_LABELS } from "@/lib/labels";
import styles from "../admin.module.css";

export default function AdminProfilePage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  // В API нет /users/me, поэтому находим себя в списке пользователей по логину
  const { data, loading, error, reload } = useFetch(async () => {
    const [users, students, payments] = await Promise.all([
      usersApi.list(),
      studentsApi.list(),
      paymentsApi.list(),
    ]);
    const me = users.find((u) => u.username === session?.username) ?? null;
    const confirmedByMe = me ? payments.filter((p) => p.confirmed_by_admin_id === me.id).length : 0;
    return { me, studentsCount: students.length, confirmedByMe };
  });

  const handleLogout = async () => {
    setLeaving(true);
    await logout();
    router.replace("/login");
  };

  const username = session?.username ?? "Администратор";
  const myId = data?.me?.id;

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <ProfileHero
            name={username}
            subtitle="Администратор EduFlow"
            badges={
              <>
                <Badge tone="info">{ROLE_LABELS.admin}</Badge>
                {data.me &&
                  (data.me.is_active ? <Badge tone="success">Активен</Badge> : <Badge>Отключён</Badge>)}
              </>
            }
            stats={[
              { label: "подтвердил оплат", value: data.confirmedByMe },
              { label: "студентов", value: data.studentsCount },
            ]}
          />

          <div className={styles.profileGrid}>
            <Card title="Аккаунт">
              <InfoList
                rows={[
                  { label: "Логин", value: username },
                  { label: "Роль", value: ROLE_LABELS.admin },
                  { label: "ID", value: data.me ? `#${data.me.id}` : "—" },
                  { label: "Статус", value: data.me ? (data.me.is_active ? "Активен" : "Отключён") : "—" },
                ]}
              />
              <p className={styles.hint}>
                Логин и роль меняются в разделе «Пользователи». Свой аккаунт удалить нельзя.
              </p>
              <div className={styles.logout}>
                <Button variant="secondary" icon="logout" fullWidth loading={leaving} onClick={handleLogout}>
                  Выйти из аккаунта
                </Button>
              </div>
            </Card>

            <Card title="Смена пароля">
              {data.me ? (
                <PasswordForm
                  onSubmit={async (password) => {
                    if (myId === undefined) return;
                    await usersApi.update(myId, { password });
                  }}
                />
              ) : (
                <Alert tone="info">Не удалось найти вашу учётную запись в списке пользователей.</Alert>
              )}
            </Card>
          </div>
        </>
      )}
    </AsyncState>
  );
}
