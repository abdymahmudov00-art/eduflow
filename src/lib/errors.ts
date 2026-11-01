import { ApiError } from "@/lib/api/client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Что-то пошло не так";
}

/** 409 Conflict: например, месяц уже оплачен или платёж уже подтверждён */
export function isConflict(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

/**
 * Ответ сервера окончательный (4xx): повтор с тем же request_id не поможет.
 * При обрыве связи (0) или 5xx запрос можно повторить с тем же request_id.
 */
export function isFinalError(error: unknown) {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}
