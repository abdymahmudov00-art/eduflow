import { ApiError } from "@/lib/api/client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "Что-то пошло не так";
}

export function isNotFound(error: unknown) {
  return error instanceof ApiError && error.status === 404;
}
