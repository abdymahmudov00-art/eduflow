import { http } from "./client";
import { uuid4 } from "./payments";
import type { FinikPayment, FinikPaymentCreate, FinikResolve, FinikTransaction } from "./types";

/** Привести статус Finik к нижнему регистру: PENDING → pending */
export const finikStatus = (status: string | null | undefined) => (status ?? "").toLowerCase();

export const finikApi = {
  /** Создать онлайн-оплату. В ответе payment_url — его открываем для оплаты */
  createPayment: (data: FinikPaymentCreate) =>
    http.post<FinikPayment>("/finik/payments", { request_id: uuid4(), ...data }),
  /** Статус онлайн-оплаты (опрашиваем, пока студент платит) */
  getPayment: (paymentId: number) => http.get<FinikPayment>(`/finik/payments/${paymentId}`),

  /** Админ: список транзакций Finik */
  transactions: (params: { status?: string; staleMinutes?: number; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.staleMinutes) query.set("stale_minutes", String(params.staleMinutes));
    query.set("limit", String(params.limit ?? 100));
    query.set("offset", String(params.offset ?? 0));
    return http.get<FinikTransaction[]>(`/finik/transactions?${query}`);
  },
  /** Админ: повторно запросить статус у Finik */
  retry: (transactionId: number) => http.post<FinikTransaction>(`/finik/transactions/${transactionId}/retry`),
  /** Админ: вручную подтвердить или отклонить спорную операцию */
  resolve: (transactionId: number, data: FinikResolve) =>
    http.post<FinikTransaction>(`/finik/transactions/${transactionId}/resolve`, data),
};
