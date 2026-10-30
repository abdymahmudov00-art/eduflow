import { request } from "./client";
import type { Me, TokenPair } from "./types";

export const authApi = {
  login: (username: string, password: string) =>
    request<TokenPair>("/auth/login", {
      method: "POST",
      body: { username, password },
      auth: false,
    }),
  logout: (refreshToken: string) =>
    request<{ message: string }>("/auth/logout", {
      method: "POST",
      body: { refresh_token: refreshToken },
    }),
  /** Кто вошёл: id, логин, роль, student_id */
  me: () => request<Me>("/auth/me"),
};
