"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Загрузка данных при монтировании + reload() для повторной загрузки */
export function useFetch<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, loading: true });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetcher()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, error: getErrorMessage(error), loading: false });
      });
    return () => {
      cancelled = true;
    };
    // fetcher намеренно не в зависимостях: перезагрузка только через reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const reload = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true }));
    setVersion((v) => v + 1);
  }, []);

  return { ...state, reload };
}
