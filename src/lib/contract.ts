// Помесячный график контракта, собранный из платежей (в API нет отдельной сущности «месяц»)

import type { AcademicLeave, Contract, Payment } from "@/lib/api/types";
import { toNumber } from "@/lib/format";

export type MonthStatus = "paid" | "pending" | "leave" | "rejected" | "expected";

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

function statusFor(payments: Payment[], leave: AcademicLeave | null): MonthStatus {
  if (payments.some((p) => p.status === "confirmed")) return "paid";
  if (payments.some((p) => p.status === "pending")) return "pending";
  if (leave) return "leave";
  if (payments.some((p) => p.status === "rejected")) return "rejected";
  return "expected";
}

/** Строит список месяцев контракта и раскладывает по ним платежи */
export function buildContractMonths(contract: Contract, payments: Payment[]): ContractMonth[] {
  const start = contractStartMonth(contract);
  const own = payments.filter((p) => p.contract_id === contract.id);
  return Array.from({ length: contract.duration_months }, (_, i) => {
    const key = addMonths(start, i);
    const monthPayments = own.filter((p) => p.payment_month === key);
    const leave = leaveFor(contract, key);
    return {
      index: i + 1,
      key,
      status: statusFor(monthPayments, leave),
      payments: monthPayments,
      leave,
      paidAmount: monthPayments
        .filter((p) => p.status === "confirmed")
        .reduce((sum, p) => sum + toNumber(p.amount), 0),
    };
  });
}

/** Первый месяц, который ещё не оплачен и не на проверке — его удобно предлагать по умолчанию */
export function firstOpenMonth(months: ContractMonth[]): string | undefined {
  return months.find((m) => m.status === "expected" || m.status === "rejected")?.key;
}
