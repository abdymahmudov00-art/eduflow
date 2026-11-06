// Помесячный график контракта, собранный из платежей (в API нет отдельной сущности «месяц»)

import type { AcademicLeave, Contract, Payment } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export type MonthStatus = "paid" | "partial" | "pending" | "leave" | "rejected" | "expected";

export interface ContractMonth {
  /** Порядковый номер месяца контракта, с 1 */
  index: number;
  /** "YYYY-MM" — так же, как payment_month у платежа */
  key: string;
  status: MonthStatus;
  payments: Payment[];
  /** Действующий академический отпуск, попадающий на этот месяц */
  leave: AcademicLeave | null;
  /** Сумма подтверждённых платежей за месяц */
  paidAmount: number;
  /** Сумма платежей, которые ждут проверки */
  pendingAmount: number;
  /** Сколько нужно заплатить за месяц (ежемесячный платёж) */
  dueAmount: number;
  /** Сколько ещё можно внести: due − подтверждённые − на проверке (не меньше 0) */
  remainingAmount: number;
}

/** "2026-09" + 3 → "2026-12" */
export function addMonths(key: string, count: number): string {
  const [y, m] = key.split("-").map(Number);
  const total = y * 12 + (m - 1) + count;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** Месяц начала контракта: "2026-09-15" → "2026-09" */
export function contractStartMonth(contract: Contract): string {
  return contract.start_date.slice(0, 7);
}

/** Последний месяц контракта */
export function contractEndMonth(contract: Contract): string {
  return addMonths(contractStartMonth(contract), Math.max(contract.duration_months - 1, 0));
}

/** Отпуска, которые не отменены */
export function activeLeaves(contract: Contract): AcademicLeave[] {
  return (contract.academic_leaves ?? []).filter((l) => !l.cancelled_at);
}

/** Отпуск, который захватывает месяц "YYYY-MM" (хотя бы частично) */
function leaveFor(contract: Contract, key: string): AcademicLeave | null {
  return (
    activeLeaves(contract).find((l) => l.start_date.slice(0, 7) <= key && key <= l.end_date.slice(0, 7)) ?? null
  );
}

/** Округление до копеек, чтобы 0.1 + 0.2 не давало «недоплату» */
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Онлайн-оплата через Finik (подтверждается автоматически, админ её не проверяет) */
export const isOnlinePayment = (p: Payment) => (p.payment_method ?? "").toLowerCase() === "finik";

/**
 * Платёж ждёт проверки администратора.
 * Незавершённые онлайн-оплаты сюда не входят: студент мог закрыть страницу оплаты
 * и не заплатить — такой платёж не должен «занимать» месяц.
 */
export const isAwaitingReview = (p: Payment) => p.status === "pending" && !isOnlinePayment(p);

const sumOf = (payments: Payment[], status: Payment["status"]) =>
  round2(
    payments
      .filter((p) => (status === "pending" ? isAwaitingReview(p) : p.status === status))
      .reduce((sum, p) => sum + toNumber(p.amount), 0),
  );

function statusFor(payments: Payment[], leave: AcademicLeave | null, paid: number, due: number): MonthStatus {
  if (paid > 0 && paid >= due) return "paid";
  if (payments.some(isAwaitingReview)) return "pending";
  if (paid > 0) return "partial";
  if (leave) return "leave";
  if (payments.some((p) => p.status === "rejected")) return "rejected";
  return "expected";
}

/** Строит список месяцев контракта и раскладывает по ним платежи */
export function buildContractMonths(contract: Contract, payments: Payment[]): ContractMonth[] {
  const start = contractStartMonth(contract);
  const own = payments.filter((p) => p.contract_id === contract.id);
  const due = toNumber(contract.monthly_payment);
  return Array.from({ length: contract.duration_months }, (_, i) => {
    const key = addMonths(start, i);
    const monthPayments = own.filter((p) => p.payment_month === key);
    const leave = leaveFor(contract, key);
    const paidAmount = sumOf(monthPayments, "confirmed");
    const pendingAmount = sumOf(monthPayments, "pending");
    return {
      index: i + 1,
      key,
      status: statusFor(monthPayments, leave, paidAmount, due),
      payments: monthPayments,
      leave,
      paidAmount,
      pendingAmount,
      dueAmount: due,
      remainingAmount: Math.max(round2(due - paidAmount - pendingAmount), 0),
    };
  });
}

/** Можно ли сейчас внести оплату за месяц */
export function isMonthOpen(month: ContractMonth): boolean {
  return month.status !== "leave" && month.remainingAmount > 0;
}

/**
 * Почему за месяц нельзя заплатить (null — можно).
 * Бэкенд тоже запрещает повторную оплату (409), но лучше предупредить заранее.
 */
export function monthBlockReason(month: ContractMonth | undefined): string | null {
  if (!month) return "Этот месяц не входит в срок контракта";
  if (month.status === "leave") return "Академический отпуск — оплата за этот месяц не нужна";
  if (month.status === "paid") return "Этот месяц уже оплачен полностью";
  if (month.remainingAmount <= 0) return "За этот месяц уже есть платёж на проверке на всю сумму";
  return null;
}

/** Первый месяц, за который ещё можно заплатить — его удобно предлагать по умолчанию */
export function firstOpenMonth(months: ContractMonth[]): string | undefined {
  return months.find(isMonthOpen)?.key;
}
