"use client";

import { useEffect, useState } from "react";
import MonthTimeline from "@/components/page/shared/month-timeline/MonthTimeline";
import BalanceCard from "@/components/page/student/balance-card/BalanceCard";
import GroupPanel from "@/components/page/student/group-panel/GroupPanel";
import FinikCheckout from "@/components/page/student/finik-checkout/FinikCheckout";
import PaymentForm from "@/components/page/student/payment-form/PaymentForm";
import Alert from "@/components/ui/alert/Alert";
import AsyncState from "@/components/ui/async-state/AsyncState";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Card from "@/components/ui/card/Card";
import Modal from "@/components/ui/modal/Modal";
import PageHeader from "@/components/ui/page-header/PageHeader";
import Select from "@/components/ui/select/Select";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import Table from "@/components/ui/table/Table";
import GroupHistory from "@/components/page/shared/group-history/GroupHistory";
import { contractsApi, finikApi, finikStatus, groupsApi, paymentsApi, studentsApi } from "@/lib/api";
import type { FinikPayment, Payment } from "@/lib/api/types";
import { activeLeaves, buildContractMonths, firstOpenMonth, isOnlinePayment } from "@/lib/contract";
import { getErrorMessage, isConflict, isNotFound } from "@/lib/errors";
import { formatDate, formatDateTime, formatMoney, formatMonth } from "@/lib/format";
import { useFetch } from "@/lib/hooks/useFetch";
import { paymentMethodLabel } from "@/lib/labels";
import styles from "../student.module.css";

/** Платёж создан меньше суток назад — QR ещё может быть действителен */
function isRecent(createdAt: string) {
  const time = Date.parse(createdAt);
  return Number.isFinite(time) && Date.now() - time < 24 * 60 * 60 * 1000;
}

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
  const { data, loading, error, reload, refresh } = useFetch(loadContract);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  // Онлайн-оплата Finik: созданный платёж и сумма — показываем экран ожидания
  const [checkout, setCheckout] = useState<{ payment: FinikPayment; amount: string } | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const closePayment = () => {
    setPaying(false);
    setCheckout(null);
  };

  // Неоплаченные QR последних суток: следим за их статусом и обновляем страницу, когда Finik подтвердит
  const waitingIds = (data?.payments ?? [])
    .filter((p) => p.status === "pending" && isOnlinePayment(p) && isRecent(p.created_at))
    .map((p) => p.id)
    .join(",");
  useEffect(() => {
    if (!waitingIds || checkout) return; // экран оплаты сам следит за своим платежом
    const ids = waitingIds.split(",").map(Number);
    const timer = setInterval(async () => {
      const results = await Promise.all(ids.map((id) => finikApi.getPayment(id).catch(() => null)));
      if (results.some((r) => r && finikStatus(r.status) !== "pending")) refresh();
    }, 8000);
    return () => clearInterval(timer);
  }, [waitingIds, checkout, refresh]);

  /** Вернуться к неоплаченному QR: берём свежую ссылку на оплату */
  const resumePayment = async (payment: Payment) => {
    setResumeError(null);
    try {
      const fresh = await finikApi.getPayment(payment.id);
      setCheckout({ payment: fresh, amount: String(payment.amount) });
      setPaying(true);
    } catch (err) {
      setResumeError(getErrorMessage(err));
    }
  };

  const contracts = data?.contracts ?? [];
  // По умолчанию — первый активный контракт
  const contract =
    contracts.find((c) => c.id === selectedId) ?? contracts.find((c) => c.status === "active") ?? contracts[0];
  const isCollege = contract?.type === "college";
  const months = contract && !isCollege ? buildContractMonths(contract, data?.payments ?? []) : [];
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
        description="Оплата онлайн по QR-коду через Finik. Платёж засчитывается автоматически, когда банк подтвердит оплату. Оплату наличными принимает администратор."
        actions={
          canPay ? (
            <Button icon="wallet" onClick={() => setPaying(true)}>
              Оплатить
            </Button>
          ) : undefined
        }
      />

      {success && (
        <div className={styles.note}>
          <Alert tone="success" onClose={() => setSuccess(false)}>
            Оплата подтверждена банком и уже засчитана.
          </Alert>
        </div>
      )}

      {resumeError && (
        <div className={styles.note}>
          <Alert onClose={() => setResumeError(null)}>{resumeError}</Alert>
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
              <BalanceCard
                contract={contract}
                balance={data.balances.find((b) => b.contract_id === contract.id)}
                payments={data.payments}
              />
              <GroupPanel group={data.group} />
            </div>

            {leaves.map((leave) => (
              <Alert key={leave.id} tone="info">
                Академический отпуск: {formatDate(leave.start_date)} — {formatDate(leave.end_date)}
                {leave.reason ? ` · ${leave.reason}` : ""}. Эти месяцы не нужно оплачивать.
              </Alert>
            ))}

            {/* «Колледж»: платежи без привязки к месяцу — графика по месяцам нет */}
            {!isCollege && (
              <section>
                <div className={styles.sectionHead}>
                  <h2 className={styles.sectionTitle}>График оплат</h2>
                  <StatusBadge kind="contract" status={contract.status} />
                </div>
                <MonthTimeline months={months} />
              </section>
            )}

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
                  { key: "created", header: "Создан", render: (p) => formatDateTime(p.created_at) },
                  {
                    key: "status",
                    header: "Статус",
                    render: (p) =>
                      // Онлайн-оплату, которую ещё не завершили, не называем «На проверке»
                      isOnlinePayment(p) && p.status === "pending" ? (
                        <Badge tone="warning">Ожидает оплаты</Badge>
                      ) : (
                        <StatusBadge kind="payment" status={p.status} />
                      ),
                  },
                  {
                    key: "actions",
                    header: "",
                    align: "right",
                    render: (p) =>
                      p.status === "pending" && isOnlinePayment(p) && isRecent(p.created_at) ? (
                        <Button size="sm" variant="secondary" onClick={() => resumePayment(p)}>
                          Оплатить
                        </Button>
                      ) : null,
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </AsyncState>

      <Modal open={paying} title={checkout ? "Оплата онлайн" : "Оплата"} onClose={closePayment}>
        {checkout ? (
          <FinikCheckout
            payment={checkout.payment}
            amount={checkout.amount}
            onPaid={() => {
              setSuccess(true);
              refresh();
            }}
            onClose={() => {
              closePayment();
              refresh();
            }}
            onRetry={() => setCheckout(null)}
          />
        ) : (
          <PaymentForm
            contracts={activeContracts}
            balances={data?.balances ?? []}
            payments={data?.payments ?? []}
            defaultContractId={contract?.id}
            defaultMonth={firstOpenMonth(months)}
            onCancel={closePayment}
            onSubmit={async (values) => {
              try {
                // QR создан, но платёж ещё не оплачен — подтверждение придёт от Finik
                const payment = await finikApi.createPayment({
                  request_id: values.request_id,
                  contract_id: values.contract_id,
                  amount: values.amount,
                  payment_month: values.payment_month,
                });
                setCheckout({ payment, amount: String(values.amount) });
                refresh();
              } catch (err) {
                // 409: месяц уже оплачен или платёж уже есть — подтягиваем свежие данные
                if (isConflict(err)) refresh();
                throw err;
              }
            }}
          />
        )}
      </Modal>
    </>
  );
}
