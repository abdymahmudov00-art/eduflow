"use client";

import { useState } from "react";
import MonthTimeline from "@/components/page/shared/month-timeline/MonthTimeline";
import BalanceCard from "@/components/page/student/balance-card/BalanceCard";
import GroupPanel from "@/components/page/student/group-panel/GroupPanel";
import PaymentForm from "@/components/page/student/payment-form/PaymentForm";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/ui/page-header/PageHeader";
import Select from "@/components/ui/select/Select";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Table from "@/components/ui/table/Table";
import GroupHistory from "@/components/page/shared/group-history/GroupHistory";
import { contractsApi, groupsApi, paymentsApi, studentsApi } from "@/lib/api";
import type { Payment } from "@/lib/api/types";
import { activeLeaves, buildContractMonths, firstOpenMonth } from "@/lib/contract";
import { isNotFound } from "@/lib/errors";
import { formatDate, formatDateTime, formatMoney, formatMonth } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { paymentMethodLabel } from "@/lib/labels";
import styles from "../student.module.css";

async function loadContract() {
  const [contracts, balances, payments, group, student] = await Promise.all([
    contractsApi.my(),
    paymentsApi.myBalance(),
    paymentsApi.my(),
    groupsApi.my().catch((err) => {
      if (isNotFound(err)) return null;
      throw err;
    }),
    studentsApi.me(),
  ]);
  payments.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { contracts, balances, payments, group, student };
}

/** Контракт: сводка, помесячная лента оплат и история платежей */
export default function StudentContractPage() {
  const { data, loading, error, reload } = useFetch(loadContract);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  const contracts = data?.contracts ?? [];
  // По умолчанию — первый активный контракт
  const contract =
    contracts.find((c) => c.id === selectedId) ?? contracts.find((c) => c.status === "active") ?? contracts[0];
  const months = contract ? buildContractMonths(contract, data?.payments ?? []) : [];
  const contractPayments = (data?.payments ?? []).filter((p) => p.contract_id === contract?.id);
  const activeContracts = contracts.filter((c) => c.status === "active");
  const canPay = contract?.status === "active";
  const leaves = contract ? activeLeaves(contract) : [];
  // Студенту доступно название только текущей группы, у прошлых будет «Группа №id»
  const groupNames = new Map<number, string>(data?.group ? [[data.group.id, data.group.name]] : []);

  return (
    <>
      <PageHeader
        kicker="Контракт"
        title="Оплаты по месяцам"
        description="Каждый месяц контракта отмечается оплаченным после того, как администратор подтвердит ваш платёж."
        actions={
          canPay ? (
            <Button icon="plus" onClick={() => setPaying(true)}>
              Сообщить об оплате
            </Button>
          ) : undefined
        }
      />

      {success && (
        <div className={styles.note}>
          <Alert tone="success" onClose={() => setSuccess(false)}>
            Платёж отправлен на проверку. Месяц станет «Оплачено», когда администратор его подтвердит.
          </Alert>
        </div>
      )}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && !contract && <Alert tone="info">У вас пока нет контракта. Его оформляет администратор.</Alert>}

        {data && contract && (
          <div className={styles.stack}>
            {contracts.length > 1 && (
              <div className={styles.contractSelect}>
                <Select
                  label="Контракт"
                  options={contracts.map((c) => ({
                    value: String(c.id),
                    label: `Контракт №${c.id} · ${formatMoney(c.total_amount)}`,
                  }))}
                  value={String(contract.id)}
                  onChange={(e) => setSelectedId(Number(e.target.value))}
                />
              </div>
            )}

            <div className={styles.summaryGrid}>
              <BalanceCard contract={contract} balance={data.balances.find((b) => b.contract_id === contract.id)} />
              <GroupPanel group={data.group} />
            </div>

            {leaves.map((leave) => (
              <Alert key={leave.id} tone="info">
                Академический отпуск: {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                {leave.reason ? ` · ${leave.reason}` : ""}. Эти месяцы не нужно оплачивать.
              </Alert>
            ))}

            <section>
              <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}>График оплат</h2>
                <StatusBadge kind="contract" status={contract.status} />
              </div>
              <MonthTimeline months={months} />
            </section>

            <Card title="История групп">
              <GroupHistory items={data.student.group_history ?? []} groupNames={groupNames} />
            </Card>

            <Card title="История платежей">
              <Table<Payment>
                rows={contractPayments}
                rowKey={(p) => p.id}
                emptyText="По этому контракту ещё не было платежей"
                columns={[
                  { key: "month", header: "Месяц", render: (p) => formatMonth(p.payment_month) },
                  { key: "amount", header: "Сумма", align: "right", render: (p) => formatMoney(p.amount) },
                  { key: "method", header: "Способ", render: (p) => paymentMethodLabel(p.payment_method) },
                  { key: "created", header: "Отправлен", render: (p) => formatDateTime(p.created_at) },
                  { key: "status", header: "Статус", render: (p) => <StatusBadge kind="payment" status={p.status} /> },
                ]}
              />
            </Card>
          </div>
        )}
      </AsyncState>

      <Modal open={paying} title="Сообщить об оплате" onClose={() => setPaying(false)}>
        <PaymentForm
          contracts={activeContracts}
          balances={data?.balances ?? []}
          defaultContractId={contract?.id}
          defaultMonth={firstOpenMonth(months)}
          onCancel={() => setPaying(false)}
          onSubmit={async (values) => {
            await paymentsApi.create(values);
            setPaying(false);
            setSuccess(true);
            reload();
          }}
        />
      </Modal>
    </>
  );
}
