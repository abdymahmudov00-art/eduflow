// HTTP-клиент: добавляет токен, при 401 обновляет его через /auth/refresh и повторяет запрос

import { clearAuth, tokenStorage } from "@/lib/auth/storage";
import type { TokenPair } from "./types";

/** Запросы идут на Next.js, а он проксирует их на бэкенд (см. next.config.ts) */
export const API_BASE = "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ValidationItem = { loc?: (string | number)[]; msg?: string };

/** FastAPI отдаёт detail строкой или массивом ошибок валидации (422) */
function parseDetail(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("detail" in body)) return null;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item: ValidationItem) => {
        const field = item.loc?.filter((part) => part !== "body").join(".");
        return field ? `${field}: ${item.msg}` : item.msg;
      })
      .filter(Boolean)
      .join("; ");
  }
  return null;
}

let refreshPromise: Promise<string | null> | null = null;

/** Обновляет пару токенов. Параллельные запросы ждут один и тот же refresh */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = tokenStorage.getRefresh();
      if (!refreshToken) return null;
      try {
        const res = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        if (!res.ok) return null;
        const tokens = (await res.json()) as TokenPair;
        tokenStorage.set(tokens);
        return tokens.access_token;
      } catch {
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Объект уйдёт как JSON, FormData — как multipart (загрузка файлов) */
  body?: unknown;
  /** false — не подставлять токен (login/refresh) */
  auth?: boolean;
  /** "blob" — вернуть файл (например, фото), а не JSON */
  responseType?: "json" | "blob";
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, responseType = "json" } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const send = async (token: string | null) => {
    const headers: Record<string, string> = {};
    // Для FormData заголовок с boundary браузер ставит сам
    if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      return await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(0, "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз");
    }
  };

  let res = await send(auth ? tokenStorage.getAccess() : null);

  if (res.status === 401 && auth) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      clearAuth();
      throw new ApiError(401, "Сессия истекла. Войдите снова");
    }
    res = await send(newToken);
    if (res.status === 401) {
      clearAuth();
      throw new ApiError(401, "Сессия истекла. Войдите снова");
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, parseDetail(data) ?? `Ошибка сервера (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  if (responseType === "blob") return (await res.blob()) as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T = void>(path: string) => request<T>(path, { method: "DELETE" }),
};
