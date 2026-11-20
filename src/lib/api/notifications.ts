import { http } from "./client";
import type { AppNotification } from "./types";

/** Ответ unread-count может прийти как число или как объект — достаём число */
function readCount(data: unknown): number {
  if (typeof data === "number") return data;
  if (data && typeof data === "object") {
    for (const key of ["unread_count", "count", "unread"]) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === "number") return value;
    }
  }
  return 0;
}

export const notificationsApi = {
  list: (params: { unreadOnly?: boolean; limit?: number; offset?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.unreadOnly) query.set("unread_only", "true");
    query.set("limit", String(params.limit ?? 30));
    query.set("offset", String(params.offset ?? 0));
    return http.get<AppNotification[]>(`/notifications/?${query}`);
  },
  unreadCount: async () => readCount(await http.get<unknown>("/notifications/unread-count")),
  markRead: (id: number) => http.patch<AppNotification>(`/notifications/${id}/read`),
  markAllRead: () => http.patch<unknown>("/notifications/read-all"),
};
