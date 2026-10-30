"use client";

import { useEffect, useState } from "react";
import { studentsApi } from "@/lib/api";

/**
 * Фото студента. Картинка отдаётся только с токеном, поэтому <img src> напрямую не работает:
 * скачиваем файл и делаем из него временный URL. null — фото нет (или нет доступа).
 * version — увеличьте после загрузки нового фото, чтобы перечитать.
 */
export function useStudentPhoto(studentId: number | null | undefined, version = 0): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    let objectUrl: string | null = null;
    studentsApi
      .photo(studentId)
      .then((blob) => {
        if (cancelled || !blob.type.startsWith("image/")) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [studentId, version]);

  return studentId ? url : null;
}
