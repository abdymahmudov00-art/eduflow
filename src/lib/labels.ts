import type { ContractStatus, ContractType, GroupHistoryKind, PaymentStatus, PersonalInfoStatus, UserRole, Weekday } from "@/lib/api/types";

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

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  academy: "Академия",
  college: "Колледж",
};

/** Статусы транзакций Finik. Неизвестный статус показываем как есть */
export const FINIK_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает оплаты",
  created: "Создан",
  processing: "В обработке",
  confirmed: "Оплачен",
  succeeded: "Оплачен",
  success: "Оплачен",
  rejected: "Отклонён",
  failed: "Ошибка",
  expired: "Истёк",
  cancelled: "Отменён",
  review: "Нужна проверка",
  needs_review: "Нужна проверка",
  disputed: "Спорный",
};

export function finikStatusLabel(status: string) {
  return FINIK_STATUS_LABELS[status.toLowerCase()] ?? status;
}

export const PAYMENT_METHODS = [
  { value: "card", label: "Банковская карта" },
  { value: "transfer", label: "Перевод" },
  { value: "cash", label: "Наличные" },
];

export function paymentMethodLabel(value: string | null | undefined) {
  if (!value) return "—";
  if (value.toLowerCase() === "finik") return "Онлайн (Finik)";
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
