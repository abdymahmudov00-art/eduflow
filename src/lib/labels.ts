import type { ContractStatus, GroupHistoryKind, PaymentStatus, PersonalInfoStatus, UserRole, Weekday } from "@/lib/api/types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Администратор",
  student: "Студент",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "На проверке",
  confirmed: "Подтверждён",
  rejected: "Отклонён",
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  active: "Активный",
  completed: "Завершён",
  cancelled: "Отменён",
};

export const PAYMENT_METHODS = [
  { value: "card", label: "Банковская карта" },
  { value: "transfer", label: "Перевод" },
  { value: "cash", label: "Наличные" },
];

export function paymentMethodLabel(value: string | null | undefined) {
  if (!value) return "—";
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value;
}

export const PROFILE_STATUS_LABELS: Record<PersonalInfoStatus, string> = {
  not_submitted: "Не отправлена",
  pending: "На проверке",
  approved: "Принята",
  revision: "Нужно исправить",
};

export const GROUP_HISTORY_LABELS: Record<GroupHistoryKind, string> = {
  enrollment: "Поступление",
  transfer: "Перевод",
};

/** Порядок и подписи дней недели (бэкенд отдаёт английские названия) */
export const WEEKDAYS: { value: Weekday; label: string; short: string }[] = [
  { value: "Monday", label: "Понедельник", short: "Пн" },
  { value: "Tuesday", label: "Вторник", short: "Вт" },
  { value: "Wednesday", label: "Среда", short: "Ср" },
  { value: "Thursday", label: "Четверг", short: "Чт" },
  { value: "Friday", label: "Пятница", short: "Пт" },
  { value: "Saturday", label: "Суббота", short: "Сб" },
  { value: "Sunday", label: "Воскресенье", short: "Вс" },
];

export function weekdayLabel(value: string) {
  return WEEKDAYS.find((d) => d.value === value)?.label ?? value;
}

export function weekdayIndex(value: string) {
  const i = WEEKDAYS.findIndex((d) => d.value === value);
  return i === -1 ? 99 : i;
}
