"use client";

import { useSyncExternalStore } from "react";
import { authApi, studentsApi, usersApi } from "@/lib/api";
import type { UserRole } from "@/lib/api/types";
import { clearAuth, sessionStore, tokenStorage, type Session } from "./storage";

/** Пытается прочитать роль из JWT (если бэкенд её туда кладёт) */
function roleFromToken(token: string): UserRole | null {
  try {
    const part = token.split(".")[1];
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as { role?: unknown };
    return payload.role === "admin" || payload.role === "student" ? payload.role : null;
  } catch {
    return null;
  }
}

/** Роль: из токена, иначе GET /auth/me, иначе (старый бэкенд) пробными запросами */
async function detectRole(accessToken: string): Promise<UserRole | null> {
  const fromToken = roleFromToken(accessToken);
  if (fromToken) return fromToken;
  try {
    const me = await authApi.me();
    if (me.role === "admin" || me.role === "student") return me.role;
  } catch {
    // нет /auth/me — пробуем по-старому
  }
  try {
    await studentsApi.me();
    return "student";
  } catch {
    // не студент — проверяем админа
  }
  try {
    await usersApi.list();
    return "admin";
  } catch {
    return null;
  }
}

export function homePathFor(role: UserRole) {
  return role === "admin" ? "/admin" : "/student";
}

async function login(username: string, password: string): Promise<Session> {
  const tokens = await authApi.login(username, password);
  tokenStorage.set(tokens);
  const role = await detectRole(tokens.access_token);
  if (!role) {
    clearAuth();
    throw new Error("Не удалось определить роль пользователя. Обратитесь к администратору");
  }
  const session: Session = { username, role };
  sessionStore.set(session);
  return session;
}

async function logout() {
  const refreshToken = tokenStorage.getRefresh();
  if (refreshToken) {
    try {
      await authApi.logout(refreshToken);
    } catch {
      // даже если сервер не ответил — выходим локально
    }
  }
  clearAuth();
}

/**
 * session: undefined — ещё загружается, null — гость, объект — вошедший пользователь
 */
export function useAuth() {
  const session = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
  return { session, login, logout };
}
