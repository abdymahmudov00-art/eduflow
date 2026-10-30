// Хранение токенов и сессии в localStorage + подписка для useSyncExternalStore

import type { TokenPair, UserRole } from "@/lib/api/types";

export interface Session {
  username: string;
  role: UserRole;
}

const ACCESS_KEY = "eduflow_access_token";
const REFRESH_KEY = "eduflow_refresh_token";
const SESSION_KEY = "eduflow_session";

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто игнорируем
  }
}

export const tokenStorage = {
  getAccess: () => safeGet(ACCESS_KEY),
  getRefresh: () => safeGet(REFRESH_KEY),
  set(tokens: TokenPair) {
    safeSet(ACCESS_KEY, tokens.access_token);
    safeSet(REFRESH_KEY, tokens.refresh_token);
  },
  clear() {
    safeSet(ACCESS_KEY, null);
    safeSet(REFRESH_KEY, null);
  },
};

// ----- Сессия (кто вошёл) -----

const listeners = new Set<() => void>();
let cached: Session | null | undefined;

function readSession(): Session | null {
  const raw = safeGet(SESSION_KEY);
  if (!raw || !tokenStorage.getAccess()) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    if (parsed && (parsed.role === "admin" || parsed.role === "student")) return parsed;
    return null;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export const sessionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    // Синхронизация между вкладками
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith("eduflow_")) {
        cached = undefined;
        listener();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  /** null — гость, Session — вошёл */
  getSnapshot(): Session | null {
    if (cached === undefined) cached = readSession();
    return cached;
  },
  /** На сервере сессия неизвестна — undefined означает «загрузка» */
  getServerSnapshot(): Session | null | undefined {
    return undefined;
  },
  set(session: Session | null) {
    safeSet(SESSION_KEY, session ? JSON.stringify(session) : null);
    cached = session;
    emit();
  },
};

/** Полный выход: удалить токены и сессию */
export function clearAuth() {
  tokenStorage.clear();
  sessionStore.set(null);
}
