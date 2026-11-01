import type { ReactNode } from "react";
import type { ContractMonth, MonthStatus } from "@/lib/contract";
import { formatMoney, formatMonth } from "@/lib/format";
import styles from "./month-timeline.module.css";

const STATUS_LABELS: Record<MonthStatus, string> = {
  paid: "Оплачено",
  partial: "Частично",
  pending: "На проверке",
  leave: "Академ. отпуск",
  rejected: "Отклонено",
  expected: "Ожидается",
};

const STATUS_HINTS: Record<MonthStatus, string> = {
  paid: "Подтверждено администратором",
  partial: "Оплачена часть суммы",
  pending: "Платёж ждёт проверки",
  leave: "Пауза в обучении — оплата не требуется",
  rejected: "Платёж отклонён — отправьте снова",
  expected: "Оплаты пока нет",
};

/** Подпись под месяцем: суммы, если по месяцу уже были деньги */
function hintFor(month: ContractMonth): string {
  if (month.status === "paid") return formatMoney(month.paidAmount);
  if (month.status === "partial")
    return `${formatMoney(month.paidAmount)} из ${formatMoney(month.dueAmount)} · осталось ${formatMoney(month.remainingAmount)}`;
  if (month.status === "pending") {
    const parts = [`на проверке ${formatMoney(month.pendingAmount)}`];
    if (month.paidAmount > 0) parts.unshift(`оплачено ${formatMoney(month.paidAmount)}`);
    return parts.join(" · ");
  }
  return STATUS_HINTS[month.status];
}

interface MonthTimelineProps {
  months: ContractMonth[];
  /** Доп. действия внутри карточки месяца (например, кнопки админа) */
  renderActions?: (month: ContractMonth) => ReactNode;
}

/** Лента месяцев контракта: каждый месяц — карточка со статусом */
const MonthTimeline = ({ months, renderActions }: MonthTimelineProps) => (
  <div className={styles.timeline}>
    {months.map((month) => {
      const actions = renderActions?.(month);
      return (
        <article key={month.key} className={`${styles.month} ${styles[month.status]}`}>
          <span className={styles.status}>{STATUS_LABELS[month.status]}</span>
          <strong className={styles.title}>Месяц {month.index}</strong>
          <span className={styles.period}>{formatMonth(month.key)}</span>
          <small className={styles.hint}>{hintFor(month)}</small>
          {actions && <div className={styles.actions}>{actions}</div>}
        </article>
      );
    })}
  </div>
);

export default MonthTimeline;
