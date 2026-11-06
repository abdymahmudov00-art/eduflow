import ProgressBar from "@/components/ui/progress-bar/ProgressBar";
import StatusBadge from "@/components/ui/status-badge/StatusBadge";
import type { Balance, Contract, Payment } from "@/lib/api/types";
import { isAwaitingReview } from "@/lib/contract";
import { formatDate, formatMoney, toNumber } from "@/lib/format";
import styles from "./balance-card.module.css";

interface BalanceCardProps {
  contract: Contract;
  balance?: Balance;
  /** Платежи студента: для запасного расчёта и суммы «на проверке» */
  payments?: Payment[];
}

const BalanceCard = ({ contract, balance, payments = [] }: BalanceCardProps) => {
  // Суммы приходят числом или строкой (Decimal) — приводим к числу.
  // Если баланса нет, считаем по подтверждённым платежам.
  const total = balance ? toNumber(balance.total_amount) : toNumber(contract.total_amount);
  const paid = balance
    ? toNumber(balance.paid_amount)
    : payments
        .filter((p) => p.contract_id === contract.id && p.status === "confirmed")
        .reduce((sum, p) => sum + toNumber(p.amount), 0);
  const remaining = balance ? toNumber(balance.remaining_amount) : Math.max(total - paid, 0);
  const pending = payments
    .filter((p) => p.contract_id === contract.id && isAwaitingReview(p))
    .reduce((sum, p) => sum + toNumber(p.amount), 0);
  const overdueMonths = balance?.overdue_months ?? 0;
  const overdueAmount = toNumber(balance?.overdue_amount ?? 0);
  const nextAmount = balance?.next_due_amount != null ? toNumber(balance.next_due_amount) : null;
  const nextDate = balance?.next_due_date ?? null;
  const percent = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div>
          <h3 className={styles.title}>Контракт №{contract.id}</h3>
          <span className={styles.meta}>с {formatDate(contract.start_date)}</span>
        </div>
        <StatusBadge kind="contract" status={contract.status} />
      </div>

      <div className={styles.amounts}>
        <div>
          <span className={styles.label}>Оплачено</span>
          <strong className={styles.paid}>{formatMoney(paid)}</strong>
        </div>
        <div className={styles.right}>
          <span className={styles.label}>Осталось</span>
          <strong className={styles.remaining}>{formatMoney(remaining)}</strong>
        </div>
      </div>

      <ProgressBar value={percent} label="Оплачено от суммы контракта" />
      {pending > 0 && <p className={styles.pending}>Ещё {formatMoney(pending)} на проверке у администратора</p>}

      {(overdueMonths > 0 || overdueAmount > 0) && (
        <div className={styles.overdue}>
          <strong>Просрочено: {formatMoney(overdueAmount)}</strong>
          {overdueMonths > 0 && <span>{monthsText(overdueMonths)}</span>}
        </div>
      )}

      {(nextAmount !== null || nextDate) && remaining > 0 && (
        <div className={styles.next}>
          <span className={styles.label}>Следующий платёж</span>
          <strong>
            {nextAmount !== null ? formatMoney(nextAmount) : "—"}
            {nextDate ? ` до ${formatDate(nextDate)}` : ""}
          </strong>
        </div>
      )}

      <dl className={styles.details}>
        <div>
          <dt>Сумма контракта</dt>
          <dd>{formatMoney(total)}</dd>
        </div>
        <div>
          <dt>В месяц</dt>
          <dd>{formatMoney(contract.monthly_payment)}</dd>
        </div>
        <div>
          <dt>Оплачено месяцев</dt>
          <dd>
            {balance?.paid_months ?? 0} из {contract.duration_months}
          </dd>
        </div>
        {contract.payment_day && (
          <div>
            <dt>День оплаты</dt>
            <dd>до {contract.payment_day}-го числа</dd>
          </div>
        )}
      </dl>
    </article>
  );
};

/** 1 месяц, 2 месяца, 5 месяцев */
function monthsText(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  const word =
    mod10 === 1 && mod100 !== 11 ? "месяц" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "месяца" : "месяцев";
  return `${n} ${word}`;
}

export default BalanceCard;
