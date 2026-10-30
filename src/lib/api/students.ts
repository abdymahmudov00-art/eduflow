import { http, request } from "./client";
import type { Student, StudentCreate, StudentUpdate } from "./types";

export const studentsApi = {
  list: () => http.get<Student[]>("/students/"),
  me: () => http.get<Student>("/students/me"),
  get: (id: number) => http.get<Student>(`/students/${id}`),
  create: (data: StudentCreate) => http.post<Student>("/students/", data),
  /** Перевод в другую группу и/или смена номера (история переводов пишется на сервере) */
  update: (id: number, data: StudentUpdate) => http.patch<Student>(`/students/${id}`, data),
  remove: (id: number) => http.delete(`/students/${id}`),
  /** Загрузить своё фото (multipart, поле file) */
  uploadMyPhoto: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<unknown>("/students/me/photo", { method: "PUT", body: form });
  },
  /** Фото студента как файл — для <img> через URL.createObjectURL */
  photo: (id: number) => request<Blob>(`/students/${id}/photo`, { responseType: "blob" }),
};
