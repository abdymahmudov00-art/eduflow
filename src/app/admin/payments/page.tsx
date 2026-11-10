"use client";

import { useState } from "react";
import FinikTransactions from "@/components/page/admin/finik-transactions/FinikTransactions";
import ManualPaymentForm from "@/components/page/admin/manual-payment-form/ManualPaymentForm";
import MonthTimeline from "@/components/page/shared/month-timeline/MonthTimeline";
import Modal from "@/components/ui/modal/Modal";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Button from "@/components/ui/button/Button";
import ConfirmDialog from "@/components/ui/confirm-dialog/ConfirmDialog";
import InfoList from "@/components/page/shared/info-list/InfoList";
import PageHeader from "@/components/ui/page-header/PageHeader";
import ActionMenu from "@/components/ui/action-menu/ActionMenu";
import Combobox from "@/components/ui/combobox/Combobox";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Table from "@/components/ui/table/Table";
import Tabs from "@/components/ui/tabs/Tabs";
import Card from "@/components/ui/card/Card";
import Badge from "@/components/ui/badge/Badge";
import { contractsApi, paymentsApi, studentsApi } from "@/lib/api";
import type { Payment, PaymentStatus } from "@/lib/api/types";
import {
  buildContractMonths,
  contractEndMonth,
  contractStartMonth,
  isAwaitingReview,
  isMonthOpen,
  isOnlinePayment,
} from "@/lib/contract";
import { getErrorMessage, isConflict } from "@/lib/errors";
import { formatDateTime, formatMoney, formatMonth, fullName, toNumber } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { paymentMethodLabel } from "@/lib/labels";
import styles from "../admin.module.css";

type View = "queue" | "contract" | "finik";
type Filter = PaymentStatus | "all";

async function loadPayments() {
  const [payments, contracts, students] = await Promise.all([
    paymentsApi.list(),
    contractsApi.list(),
    studentsApi.list(),
  ]);
  // Свежие сверху
  payments.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { payments, contracts, students };
}

export default function AdminPaymentsPage() {
  const { data, loading, error, reload } = useFetch(loadPayments);
  const [view, setView] = useState<View>("queue");
  const [filter, setFilter] = useState<Filter>("all");
  const [contractId, setContractId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<Payment | null>(null);
  /** Месяц, за который админ отмечает оплату ("YYYY-MM") */
  const [manualMonth, setManualMonth] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const payments = data?.payments ?? [];
  const contracts = data?.contracts ?? [];
  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const studentById = new Map((data?.students ?? []).map((s) => [s.id, s]));
  const studentNameForContract = (id: number) => {
    const contract = contractById.get(id);
    return contract ? fullName(studentById.get(contract.student_id)?.personal_info) : "—";
  };

  const matches = (p: Payment, status: PaymentStatus) => p.status === status;
  const studentNameForPayment = (paymentId: number) => {
    const payment = payments.find((p) => p.id === paymentId);
    return payment ? studentNameForContract(payment.contract_id) : "—";
  };
  const rows = filter === "all" ? payments : payments.filter((p) => matches(p, filter));
  const count = (status: PaymentStatus) => payments.filter((p) => matches(p, status)).length;

  // Вкладка «По контракту»
  const selected = contracts.find((c) => c.id === contractId) ?? contracts[0];
  const isCollege = selected?.type === "college";
  const months = selected && !isCollege ? buildContractMonths(selected, payments) : [];
  const paidMonths = months.filter((m) => m.status === "paid").length;
  const selectedPayments = selected ? payments.filter((p) => p.contract_id === selected.id) : [];
  const confirmedTotal = isCollege
    ? selectedPayments.filter((p) => p.status === "confirmed").reduce((sum, p) => sum + toNumber(p.amount), 0)
    : months.reduce((sum, m) => sum + m.paidAmount, 0);
  const outOfSchedule = isCollege ? [] : selectedPayments.filter((p) => !months.some((m) => m.key === p.payment_month));

  const changeStatus = async (payment: Payment, status: "confirmed" | "rejected") => {
    setBusyId(payment.id);
    setActionError(null);
    try {
      await paymentsApi.setStatus(payment.id, status);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
      // 409: статус уже поменяли (другой админ) или месяц уже оплачен — показываем свежие данные
      if (isConflict(err)) reload();
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    setActionError(null);
    try {
      await paymentsApi.remove(deleting.id);
      reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  const decisionButtons = (p: Payment) => (
    <>
      <Button size="sm" icon="check" loading={busyId === p.id} onClick={() => changeStatus(p, "confirmed")}>
        Оплачено
      </Button>
      <Button variant="secondary" size="sm" disabled={busyId === p.id} onClick={() => changeStatus(p, "rejected")}>
        Отклонить
      </Button>
    </>
  );

  return (
    <>
      <PageHeader
        kicker="Платежи"
        title="Платежи студентов"
        description="Студенты платят онлайн через Finik — платёж засчитывается автоматически после подтверждения банка. Оплату наличными отмечаете вы во вкладке «По контракту»."
      />

      {(actionError || notice) && (
        <div className={styles.toolbar}>
          {actionError && <Alert onClose={() => setActionError(null)}>{actionError}</Alert>}
          {notice && (
            <Alert tone="success" onClose={() => setNotice(null)}>
              {notice}
            </Alert>
          )}
        </div>
      )}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        <Tabs<View>
          value={view}
          onChange={setView}
          items={[
            { value: "queue", label: "Все платежи" },
            { value: "contract", label: "По контракту" },
            { value: "finik", label: "Онлайн (Finik)" },
          ]}
        />

        {view === "queue" && (
          <>
            <Tabs<Filter>
              value={filter}
              onChange={setFilter}
              items={[
                { value: "pending", label: "Ожидают оплаты", count: count("pending") },
                { value: "confirmed", label: "Подтверждённые", count: count("confirmed") },
                { value: "rejected", label: "Отклонённые", count: count("rejected") },
                { value: "all", label: "Все", count: payments.length },
              ]}
            />
            <Table<Payment>
              rows={rows}
              rowKey={(p) => p.id}
              emptyText={filter === "pending" ? "Неоплаченных QR нет" : "Платежей нет"}
              columns={[
                { key: "id", header: "№", width: 60, render: (p) => p.id },
                { key: "student", header: "Студент", render: (p) => <strong>{studentNameForContract(p.contract_id)}</strong> },
                { key: "contract", header: "Контракт", render: (p) => `№${p.contract_id}` },
                { key: "month", header: "Месяц", render: (p) => formatMonth(p.payment_month) },
                { key: "amount", header: "Сумма", align: "right", render: (p) => formatMoney(p.amount) },
                { key: "method", header: "Способ", render: (p) => paymentMethodLabel(p.payment_method) },
                { key: "created", header: "Создан", render: (p) => formatDateTime(p.created_at) },
                {
                  key: "status",
                  header: "Статус",
                  render: (p) =>
                    isOnlinePayment(p) && p.status === "pending" ? (
                      <Badge tone="neutral">Ждёт оплаты</Badge>
                    ) : (
                      <StatusBadge kind="payment" status={p.status} />
                    ),
                },
                {
                  key: "actions",
                  header: "",
                  width: 56,
                  align: "right",
                  render: (p) => (
                    <ActionMenu
                      items={[
                        {
                          label: "Подтвердить оплату",
                          icon: "check",
                          hidden: !isAwaitingReview(p),
                          disabled: busyId === p.id,
                          onClick: () => changeStatus(p, "confirmed"),
                        },
                        {
                          label: "Отклонить",
                          icon: "close",
                          hidden: !isAwaitingReview(p),
                          disabled: busyId === p.id,
                          onClick: () => changeStatus(p, "rejected"),
                        },
                        {
                          label: "Удалить",
                          icon: "trash",
                          danger: true,
                          hidden: p.status === "confirmed",
                          onClick: () => setDeleting(p),
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </>
        )}

        {view === "contract" &&
          (selected ? (
            <div className={styles.stack}>
              <div className={styles.contractBar}>
                <Combobox
                  label="Студент и контракт"
                  placeholder="Введите имя студента"
                  options={contracts.map((c) => ({
                    value: String(c.id),
                    label: studentNameForContract(c.id),
                    hint: `контракт №${c.id}`,
                  }))}
                  value={String(selected.id)}
                  onChange={(v) => setContractId(Number(v))}
                />
              </div>

              <div className={styles.contractSummary}>
                <Card title="Сводка">
                  <InfoList
                    rows={[
                      { label: "Статус", value: <StatusBadge kind="contract" status={selected.status} /> },
                      isCollege
                        ? { label: "Тип", value: "Колледж — без привязки к месяцам" }
                        : { label: "Оплачено месяцев", value: `${paidMonths} из ${selected.duration_months}` },
                      { label: "Подтверждено", value: formatMoney(confirmedTotal) },
                      { label: "Сумма контракта", value: formatMoney(selected.total_amount) },
                    ]}
                  />
                </Card>
                <Card title="Период">
                  <InfoList
                    rows={[
                      { label: "Начало", value: formatMonth(contractStartMonth(selected)) },
                      { label: "Окончание", value: formatMonth(contractEndMonth(selected)) },
                      { label: "В месяц", value: formatMoney(selected.monthly_payment) },
                      {
                        label: "Осталось",
                        value: formatMoney(
                          Math.max(toNumber(selected.total_amount) - confirmedTotal, 0),
                        ),
                      },
                    ]}
                  />
                </Card>
              </div>

              {isCollege ? (
                <Card
                  title="Платежи по контракту"
                  actions={
                    selected.status === "active" ? (
                      <Button variant="secondary" size="sm" icon="plus" onClick={() => setManualMonth("")}>
                        Оплата наличными
                      </Button>
                    ) : undefined
                  }
                >
                  <Table<Payment>
                    rows={selectedPayments}
                    rowKey={(p) => p.id}
                    emptyText="Платежей по контракту ещё нет"
                    columns={[
                      { key: "amount", header: "Сумма", align: "right", render: (p) => formatMoney(p.amount) },
                      { key: "method", header: "Способ", render: (p) => paymentMethodLabel(p.payment_method) },
                      { key: "created", header: "Создан", render: (p) => formatDateTime(p.created_at) },
                      { key: "status", header: "Статус", render: (p) => <StatusBadge kind="payment" status={p.status} /> },
                      {
                        key: "actions",
                        header: "",
                        align: "right",
                        render: (p) =>
                          isAwaitingReview(p) ? <div className={styles.monthButtons}>{decisionButtons(p)}</div> : null,
                      },
                    ]}
                  />
                </Card>
              ) : (
              <MonthTimeline
                months={months}
                renderActions={(month) => {
                  const pending = month.payments.filter(isAwaitingReview);
                  if (pending.length > 0) {
                    return pending.map((p) => (
                      <div key={p.id} className={styles.monthDecision}>
                        <span className={styles.muted}>{formatMoney(p.amount)}</span>
                        <div className={styles.monthButtons}>{decisionButtons(p)}</div>
                      </div>
                    ));
                  }
                  if (isMonthOpen(month) && selected.status === "active") {
                    return (
                      <Button variant="secondary" size="sm" icon="plus" onClick={() => setManualMonth(month.key)}>
                        {month.status === "partial" ? "Доплата наличными" : "Оплата наличными"}
                      </Button>
                    );
                  }
                  return null;
                }}
              />
              )}

              {outOfSchedule.length > 0 && (
                <Alert tone="info">
                  Есть платежи за месяцы вне срока контракта:{" "}
                  {outOfSchedule.map((p) => formatMonth(p.payment_month)).join(", ")}. Они видны во вкладке «Очередь
                  проверки».
                </Alert>
              )}
            </div>
          ) : (
            <Alert tone="info">Контрактов пока нет. Создайте их в разделе «Контракты».</Alert>
          ))}

        {view === "finik" && <FinikTransactions studentNameForPayment={studentNameForPayment} onChanged={reload} />}
      </AsyncState>

      <Modal
        open={manualMonth !== null && selected !== undefined}
        title={manualMonth ? `Наличные за ${formatMonth(manualMonth)}` : "Оплата наличными"}
        onClose={() => setManualMonth(null)}
      >
        {manualMonth !== null && selected && (
          <ManualPaymentForm
            contract={selected}
            months={months}
            month={manualMonth}
            onCancel={() => setManualMonth(null)}
            onSubmit={async (values) => {
              try {
                await paymentsApi.create(values);
              } catch (err) {
                if (isConflict(err)) reload();
                throw err;
              }
              setManualMonth(null);
              setNotice(values.payment_month ? `Оплата за ${formatMonth(values.payment_month)} отмечена` : "Оплата отмечена");
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Удалить платёж?"
        message={`Платёж №${deleting?.id ?? ""} на ${formatMoney(deleting?.amount)} будет удалён.`}
        confirmText="Удалить"
        danger
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
