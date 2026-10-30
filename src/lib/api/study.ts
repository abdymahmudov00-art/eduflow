import { http } from "./client";
import type { StudyProgress } from "./types";

export const studyApi = {
  /** 503 — портал оценок ещё не подключён */
  me: () => http.get<StudyProgress>("/study/me"),
};
