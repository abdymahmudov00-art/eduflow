"use client";

import { createContext, useContext } from "react";

/** Открыть мобильное меню со всеми разделами (кнопка «Все разделы» на главной) */
export const MenuContext = createContext<() => void>(() => {});

export const useOpenMenu = () => useContext(MenuContext);
