"use client";

import GroupHero from "@/components/page/student/group-hero/GroupHero";
import Greeting from "@/components/page/shared/greeting/Greeting";
import AsyncState from "@/components/ui/async-state/AsyncState";
import SectionTile from "@/components/ui/section-tile/SectionTile";
import { groupsApi, studentsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth/useAuth";
import { isNotFound } from "@/lib/errors";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "./student.module.css";

async function loadHome() {
  const [student, group] = await Promise.all([
    studentsApi.me(),
    // 404 — студент не привязан к группе, это не ошибка
    groupsApi.my().catch((err) => {
      if (isNotFound(err)) return null;
      throw err;
    }),
  ]);
  return { student, group };
}

/** Главная студента: текущая группа и четыре раздела кабинета */
export default function StudentHomePage() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useFetch(loadHome);
  const info = data?.student.personal_info;

  return (
    <>
      <Greeting
        name={info?.first_name ?? session?.username ?? ""}
        avatarName={info ? `${info.first_name} ${info.last_name}` : session?.username}
        profileHref="/student/profile"
      />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className={styles.homeStack}>
            <GroupHero group={data.group} />

            <section>
              <h2 className={styles.sectionTitle}>Разделы кабинета</h2>
              <div className={styles.tiles}>
                <SectionTile
                  href="/student/personal"
                  icon="idcard"
                  tone="violet"
                  title="Личная информация"
                  description="Анкета, фото и статус проверки"
                />
                <SectionTile
                  href="/student/contract"
                  icon="wallet"
                  tone="green"
                  title="Контракт"
                  description="Оплаты по месяцам"
                />
                <SectionTile
                  href="/student/schedule"
                  icon="calendar"
                  tone="amber"
                  title="Расписание"
                  description="Дни и время занятий"
                />
                <SectionTile
                  href="/student/study"
                  icon="book"
                  tone="pink"
                  title="Учебный процесс"
                  description="Оценки и посещаемость"
                />
              </div>
            </section>
          </div>
        )}
      </AsyncState>
    </>
  );
}
