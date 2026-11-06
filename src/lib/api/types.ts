// Типы данных API EduFlow (по OpenAPI-схеме бэкенда)

export type UserRole = "admin" | "student";
export type PaymentStatus = "pending" | "confirmed" | "rejected";
export type ContractStatus = "active" | "completed" | "cancelled";

/** Денежные суммы: бэкенд принимает число или строку, отдаёт строку (Decimal) */
export type Money = string | number;

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
}

export interface UserCreate {
  username: string;
  password: string;
  role?: UserRole;
}

export interface UserUpdate {
  username?: string | null;
  password?: string | null;
  is_active?: boolean | null;
}

export type PersonalInfoStatus = "not_submitted" | "pending" | "approved" | "revision";

export interface PersonalInfo {
  id: number;
  student_id: number;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  phone: string;
  birth_date: string;
  birth_place: string | null;
  /** Место проживания */
  address: string | null;
  /** Прописка */
  registration_address: string | null;
  status: PersonalInfoStatus;
  review_comment: string | null;
  reviewed_by_admin_id: number | null;
  reviewed_at: string | null;
}

export interface PersonalInfoInput {
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  phone: string;
  birth_date: string;
  birth_place?: string | null;
  address?: string | null;
  registration_address?: string | null;
}

export interface PersonalInfoReview {
  status: "approved" | "revision";
  comment?: string | null;
}

export type GroupHistoryKind = "enrollment" | "transfer";

export interface GroupHistoryItem {
  id: number;
  group_id: number;
  kind: GroupHistoryKind;
  from_date: string | null;
  /** null — текущая группа */
  to_date: string | null;
  reason: string | null;
}

export interface Student {
  id: number;
  user_id: number;
  group_id: number | null;
  student_number: string;
  personal_info: PersonalInfo | null;
  group_history: GroupHistoryItem[];
}

export interface StudentCreate {
  username: string;
  password: string;
  student_number: string;
  group_id?: number | null;
  personal_info?: PersonalInfoInput | null;
}

/** PATCH /students/{id}: перевод в другую группу и/или смена номера */
export interface StudentUpdate {
  group_id?: number | null;
  student_number?: string | null;
}

export type Weekday = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface Schedule {
  id: number;
  group_id: number;
  title: string;
  weekday: Weekday;
  /** "16:00:00" */
  start_time: string;
  end_time: string;
}

export interface ScheduleInput {
  group_id: number;
  title: string;
  weekday: Weekday;
  start_time: string;
  end_time: string;
}

export interface Group {
  id: number;
  name: string;
  course_name: string;
  start_date: string;
  end_date: string | null;
  schedules: Schedule[];
}

export interface GroupInput {
  name: string;
  course_name: string;
  start_date: string;
  end_date?: string | null;
}

export interface AcademicLeave {
  id: number;
  contract_id: number;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by_admin_id: number;
  created_at: string;
  /** Не null — отпуск отменён */
  cancelled_at: string | null;
}

export interface AcademicLeaveInput {
  start_date: string;
  end_date: string;
  reason?: string | null;
}

/** academy — платёж привязан к месяцу; college — месяц не обязателен */
export type ContractType = "academy" | "college";

export interface Contract {
  id: number;
  student_id: number;
  total_amount: string;
  monthly_payment: string;
  duration_months: number;
  start_date: string;
  status: ContractStatus;
  created_at: string;
  /** День месяца, до которого нужно платить */
  payment_day: number | null;
  academic_leaves: AcademicLeave[];
  type: ContractType;
}

export interface ContractInput {
  student_id: number;
  total_amount: Money;
  monthly_payment: Money;
  duration_months: number;
  start_date: string;
  payment_day?: number | null;
  type?: ContractType;
}

export interface Payment {
  id: number;
  contract_id: number;
  request_id: string | null;
  created_by_user_id: number | null;
  amount: string;
  status: PaymentStatus;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
  confirmed_by_admin_id: number | null;
  payment_month: string | null;
}

/** request_id можно не передавать — paymentsApi.create сгенерирует его сам */
export interface PaymentCreate {
  request_id?: string;
  contract_id: number;
  amount: Money;
  payment_method?: string | null;
  /** Формат "YYYY-MM". Обязателен для «Академии», для «Колледжа» — null */
  payment_month?: string | null;
}

/** Ответ /payments/my/balance — суммы приходят числами */
/** Суммы могут прийти числом или строкой (Decimal) — читать через toNumber */
export interface Balance {
  contract_id: number;
  total_amount: Money;
  paid_amount: Money;
  remaining_amount: Money;
  paid_months: number;
  duration_months: number;
  /** Сколько месяцев просрочено и на какую сумму (новые поля бэкенда, могут отсутствовать) */
  overdue_months?: number;
  overdue_amount?: Money;
  /** Следующий платёж: дата (YYYY-MM-DD) и сумма */
  next_due_date?: string | null;
  next_due_amount?: Money | null;
}

/** POST /finik/payments: онлайн-оплата по QR через Finik */
export interface FinikPaymentCreate {
  request_id?: string;
  contract_id: number;
  amount: Money;
  /** Обязателен для контрактов «Академия», для «Колледжа» можно не передавать */
  payment_month?: string | null;
}

/** Ответ Finik-эндпоинтов. Статус бэкенд может прислать в любом регистре (PENDING / pending) */
export interface FinikPayment {
  payment_id: number;
  status: string;
  payment_url?: string | null;
}

/** GET /finik/transactions (админ) */
export interface FinikTransaction {
  id: number;
  payment_id: number;
  provider_payment_id: string;
  provider_transaction_id: string | null;
  provider_operation_id: string | null;
  status: string;
  payment_url: string | null;
  review_reason: string | null;
  resolved_by_admin_id: number | null;
  resolved_at: string | null;
  admin_comment: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface FinikResolve {
  action: "confirm" | "reject";
  provider_transaction_id?: string | null;
  comment?: string | null;
}

export interface Me {
  id: number;
  username: string;
  role: UserRole;
  is_active: boolean;
  student_id?: number | null;
}

/** GET /study/me (503 — портал оценок не подключён) */
export interface StudyProgress {
  student_id: number;
  held_lessons: number;
  attended_lessons: number;
  attendance_percent: string | null;
  total_topics: number | null;
  completed_topics: number | null;
  progress_percent: string | null;
  grades: number[];
  average_grade: string | null;
}

export interface Health {
  status: string;
  database: string;
}
