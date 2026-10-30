import { http } from "./client";
import type { Schedule, ScheduleInput } from "./types";

/** Списка нет: расписание приходит внутри группы (GET /groups/my, /groups/{id}) */
export const schedulesApi = {
  create: (data: ScheduleInput) => http.post<Schedule>("/schedules/", data),
  update: (id: number, data: ScheduleInput) => http.put<Schedule>(`/schedules/${id}`, data),
  remove: (id: number) => http.delete(`/schedules/${id}`),
};
