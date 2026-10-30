import { http } from "./client";
import type { User, UserCreate, UserUpdate } from "./types";

export const usersApi = {
  list: () => http.get<User[]>("/users/"),
  get: (id: number) => http.get<User>(`/users/${id}`),
  create: (data: UserCreate) => http.post<User>("/users/", data),
  /** Частичное обновление — передаются только изменённые поля */
  update: (id: number, data: UserUpdate) => http.put<User>(`/users/${id}`, data),
  remove: (id: number) => http.delete<{ message: string }>(`/users/${id}`),
};
