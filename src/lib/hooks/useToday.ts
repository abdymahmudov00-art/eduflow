"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

function snapshot() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
}

/**
 * Текущая дата как строка-ключ "ГГГГ-ММ-ДД-ЧЧ" (месяц с 0).
 * На сервере — пустая строка, поэтому дата не попадает в пререндер.
 */
export function useToday(): string {
  return useSyncExternalStore(subscribe, snapshot, () => "");
}
