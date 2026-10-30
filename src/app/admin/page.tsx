"use client";

import Link from "next/link";
import Greeting from "@/components/page/shared/greeting/Greeting";
import AsyncState from "@/components/ui/async-state/AsyncState";
import { ButtonLink } from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import HeroCard from "@/components/ui/hero-card/HeroCard";
import Panel from "@/components/ui/panel/Panel";
import QuickAction from "@/components/ui/quick-action/QuickAction";
import SegmentBar from "@/components/ui/segment-bar/SegmentBar";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Table from "@/components/ui/table/Table";
import { contractsApi, groupsApi, paymentsApi, studentsApi, usersApi } from "@/lib/api";
import type { Payment } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/useAuth";
import { formatDateTime, formatMoney, formatMonth, fullName, toNumber } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import styles from "./admin.module.css";

async function loadOverview() {
  const [students, groups, contracts, payments, users] = await Promise.all([
    studentsApi.list(),
    groupsApi.list(),
    contractsApi.list(),
    paymentsApi.list(),
    usersApi.list(),
  ]);
  payments.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { students, groups, contracts, payments, users };
}

export default function AdminOverviewPage() {
  const { session } = useAuth();
  const { data, loading, error, reload } = useFetch(loadOverview);

  const payments = data?.payments ?? [];
  const pending = payments.filter((p) => p.status === "pending");
  const pendingSum = pending.reduce((sum, p) => sum + toNumber(p.amount), 0);
  const confirmedSum = payments
    .filter((p) => p.status === "confirmed")
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
  const countBy = (status: Payment["status"]) => payments.filter((p) => p.status === status).length;
  const activeContracts = data?.contracts.filter((c) => c.status === "active").length ?? 0;

  const studentByContract = new Map(
    (data?.contracts ?? []).map((c) => [c.id, data?.students.find((s) => s.id === c.student_id)]),
  );

  return (
    <>
      <Greeting name={session?.username ?? ""} profileHref="/admin/profile" />

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className={styles.stack}>
            <div className={styles.topGrid}>
              <HeroCard
                label="Ждут подтверждения"
                value={pending.length}
                unit="платежей"
                tag="Платежи"
                note={pending.length > 0 ? `на сумму ${formatMoney(pendingSum)}` : undefined}
                actions={
                  <>
                    <ButtonLink href="/admin/payments" variant="light" icon="check">
                      Проверить
                    </ButtonLink>
                    <ButtonLink href="/admin/students" variant="secondary" icon="plus">
                      Новый студент
                    </ButtonLink>
                  </>
                }
              />
              <Panel title="Подтверждено оплат" href="/admin/payments">
                <div className={styles.bigNumber}>{formatMoney(confirmedSum)}</div>
                <p className={styles.panelText}>
                  {activeContracts} активных контрактов из {data.contracts.length}
                </p>
              </Panel>
              <Panel title="Все платежи" href="/admin/payments">
                <div className={styles.bigNumber}>
                  {payments.length}
                  <span>всего</span>
                </div>
                <SegmentBar
                  segments={[
                    { label: "подтверждено", value: countBy("confirmed"), tone: "success" },
                    { label: "на проверке", value: countBy("pending"), tone: "warning" },
                    { label: "отклонено", value: countBy("rejected"), tone: "danger" },
                  ]}
                />
              </Panel>
            </div>

            <div className={styles.actions}>
              <QuickAction
                href="/admin/students"
                icon="users"
                tone="violet"
                title="Студенты"
                description={`${data.students.length} в системе`}
              />
              <QuickAction
                href="/admin/groups"
                icon="layers"
                tone="blue"
                title="Группы"
                description={`${data.groups.length} групп`}
              />
              <QuickAction
                href="/admin/contracts"
                icon="file"
                tone="amber"
                title="Контракты"
                description={`${activeContracts} активных`}
              />
              <QuickAction
                href="/admin/users"
                icon="shield"
                tone="green"
                title="Пользователи"
                description={`${data.users.length} аккаунтов`}
              />
            </div>

            <Card
              title="Новые платежи на проверке"
              actions={
                <Link href="/admin/payments" className={styles.link}>
                  Все платежи →
                </Link>
              }
            >
              <Table<Payment>
                rows={pending.slice(0, 6)}
                rowKey={(p) => p.id}
                emptyText="Новых платежей нет — всё проверено"
                columns={[
                  {
                    key: "student",
                    header: "Студент",
                    render: (p) => <strong>{fullName(studentByContract.get(p.contract_id)?.personal_info)}</strong>,
                  },
                  { key: "month", header: "Месяц", render: (p) => formatMonth(p.payment_month) },
                  { key: "amount", header: "Сумма", align: "right", render: (p) => formatMoney(p.amount) },
                  { key: "created", header: "Создан", render: (p) => formatDateTime(p.created_at) },
                  { key: "status", header: "Статус", render: (p) => <StatusBadge kind="payment" status={p.status} /> },
                ]}
              />
            </Card>
          </div>
        )}
      </AsyncState>
    </>
  );
}
