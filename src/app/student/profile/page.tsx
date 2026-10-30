"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import InfoList from "@/components/page/shared/info-list/InfoList";
import ProfileHero from "@/components/page/shared/profile-hero/ProfileHero";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Badge from "@/components/ui/badge/Badge";
import Button, { ButtonLink } from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import { contractsApi, groupsApi, paymentsApi, studentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import { isNotFound } from "@/lib/errors";
import { formatDate, formatMoney, fullName } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { useStudentPhoto } from "@/lib/hooks/useStudentPhoto";
import styles from "../student.module.css";

async function loadProfile() {
  const [student, group, contracts, balances] = await Promise.all([
    studentsApi.me(),
    groupsApi.my().catch((err) => {
      if (isNotFound(err)) return null;
      throw err;
    }),
    contractsApi.my(),
    paymentsApi.myBalance(),
  ]);
  return { student, group, contracts, balances };
}

/** Профиль: аккаунт и учёба. Анкета — в разделе «Личная информация» */
export default function StudentProfilePage() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const { data, loading, error, reload } = useFetch(loadProfile);
  const [leaving, setLeaving] = useState(false);

  const paid = data?.balances.reduce((sum, b) => sum + b.paid_amount, 0) ?? 0;
  const info = data?.student.personal_info;
  const photoUrl = useStudentPhoto(data?.student.id);

  const handleLogout = async () => {
    setLeaving(true);
    await logout();
    router.replace("/login");
  };

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          <ProfileHero
            name={info ? fullName(info) : (session?.username ?? "Студент")}
            subtitle={`Студент · ${data.student.student_number}`}
            photoUrl={photoUrl}
            badges={
              <>
                {data.group ? <Badge tone="info">{data.group.name}</Badge> : <Badge>Без группы</Badge>}
                {data.contracts.some((c) => c.status === "active") && <Badge tone="success">Активный контракт</Badge>}
              </>
            }
            stats={[
              { label: "контрактов", value: data.contracts.length },
              { label: "оплачено", value: formatMoney(paid) },
            ]}
          />

          <div className={styles.profileGrid}>
            <Card
              title="Учёба"
              actions={
                <ButtonLink href="/student/contract" variant="secondary" size="sm">
                  Контракт
                </ButtonLink>
              }
            >
              <InfoList
                rows={[
                  { label: "Номер студента", value: data.student.student_number },
                  { label: "Группа", value: data.group?.name ?? "—" },
                  { label: "Курс", value: data.group?.course_name ?? "—" },
                  {
                    label: "Период",
                    value: data.group
                      ? `${formatDate(data.group.start_date)} — ${data.group.end_date ? formatDate(data.group.end_date) : "…"}`
                      : "—",
                  },
                ]}
              />
            </Card>

            <Card
              title="Аккаунт"
              actions={
                <ButtonLink href="/student/personal" variant="secondary" size="sm">
                  Личная информация
                </ButtonLink>
              }
            >
              <InfoList
                rows={[
                  { label: "Логин", value: session?.username ?? "—" },
                  { label: "Роль", value: "Студент" },
                  { label: "Телефон", value: info?.phone ?? "—" },
                ]}
              />
              <p className={styles.hint}>Пароль меняет администратор. Если забыли пароль — напишите ему.</p>
              <div className={styles.logout}>
                <Button variant="secondary" icon="logout" fullWidth loading={leaving} onClick={handleLogout}>
                  Выйти из аккаунта
                </Button>
              </div>
            </Card>
          </div>
        </>
      )}
    </AsyncState>
  );
}
