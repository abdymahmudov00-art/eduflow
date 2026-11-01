import { http } from "./client";
import type { Balance, Payment, PaymentCreate } from "./types";

/**
 * UUID v4 для request_id (защита от двойной отправки платежа).
 * crypto.randomUUID есть только на https/localhost, поэтому есть запасной вариант.
 */
export function uuid4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const paymentsApi = {
  list: () => http.get<Payment[]>("/payments/"),
  my: () => http.get<Payment[]>("/payments/my"),
  myBalance: () => http.get<Balance[]>("/payments/my/balance"),
  get: (id: number) => http.get<Payment>(`/payments/${id}`),
  /**
   * Студент: платёж уходит на проверку. Админ: сразу подтверждён.
   * request_id лучше передавать из формы: тогда повтор после обрыва связи не создаст второй платёж.
   */
  create: (data: PaymentCreate) => http.post<Payment>("/payments/", { request_id: uuid4(), ...data }),
  setStatus: (id: number, status: "confirmed" | "rejected") =>
    http.patch<Payment>(`/payments/${id}/status`, { status }),
  remove: (id: number) => http.delete(`/payments/${id}`),
};
