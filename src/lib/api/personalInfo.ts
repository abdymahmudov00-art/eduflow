import { http } from "./client";
import type { PersonalInfo, PersonalInfoInput, PersonalInfoReview } from "./types";

export const personalInfoApi = {
  me: () => http.get<PersonalInfo>("/personal-info/me"),
  updateMe: (data: PersonalInfoInput) => http.put<PersonalInfo>("/personal-info/me", data),
  get: (studentId: number) => http.get<PersonalInfo>(`/personal-info/${studentId}`),
  create: (studentId: number, data: PersonalInfoInput) =>
    http.post<PersonalInfo>(`/personal-info/${studentId}`, data),
  update: (studentId: number, data: PersonalInfoInput) =>
    http.put<PersonalInfo>(`/personal-info/${studentId}`, data),
  remove: (studentId: number) => http.delete(`/personal-info/${studentId}`),
  /** Админ: принять анкету или вернуть на исправление с комментарием */
  review: (studentId: number, data: PersonalInfoReview) =>
    http.patch<PersonalInfo>(`/personal-info/${studentId}/review`, data),
};
