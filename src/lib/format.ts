import type { PersonalInfo } from "@/lib/api/types";

/** Валюта для отображения сумм — поменяйте при необходимости */
export const CURRENCY = "сом";

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: string | number | null | undefined): string {
  return `${moneyFormatter.format(toNumber(value))} ${CURRENCY}`;
}

/** "2026-09-15" → "15.09.2026" */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  return y && m && d ? `${d}.${m}.${y}` : value;
}

/** "2026-10-21T12:30:00" → "21.10.2026 12:30" */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = formatDate(value);
  const time = value.slice(11, 16);
  return time ? `${date} ${time}` : date;
}

const MONTHS = [
  "январь", "февраль", "март", "апрель", "май", "июнь",
  "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь",
];

/** "2026-12" → "декабрь 2026" */
export function formatMonth(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m] = value.split("-");
  const name = MONTHS[Number(m) - 1];
  return name && y ? `${name} ${y}` : value;
}

export function fullName(info: PersonalInfo | null | undefined): string {
  if (!info) return "—";
  return `${info.last_name} ${info.first_name}`.trim();
}

/** Текущий месяц в формате "YYYY-MM" (вызывать только в обработчиках/на клиенте) */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const WEEKDAYS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];
const MONTHS_GENITIVE = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

/** Ключ "ГГГГ-ММ-ДД-ЧЧ" → "Суббота, 24 октября" */
export function formatTodayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(y, m, d).getDay()];
  return `${weekday}, ${d} ${MONTHS_GENITIVE[m]}`;
}

/** Ключ "ГГГГ-ММ-ДД-ЧЧ" → приветствие по времени суток */
export function greetingFor(key: string): string {
  const hour = Number(key.split("-")[3]);
  if (hour < 5) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

/** "16:00:00" → "16:00" */
export function formatTime(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "—";
}

/** ФИО с отчеством, если есть */
export function fullNameWithMiddle(info: PersonalInfo | null | undefined): string {
  if (!info) return "—";
  return [info.last_name, info.first_name, info.middle_name].filter(Boolean).join(" ");
}
