import { http } from "./client";
import type { Group, GroupInput } from "./types";

export const groupsApi = {
  list: () => http.get<Group[]>("/groups/"),
  my: () => http.get<Group>("/groups/my"),
  get: (id: number) => http.get<Group>(`/groups/${id}`),
  create: (data: GroupInput) => http.post<Group>("/groups/", data),
  /** Полная замена всех полей */
  update: (id: number, data: GroupInput) => http.put<Group>(`/groups/${id}`, data),
  remove: (id: number) => http.delete(`/groups/${id}`),
};
