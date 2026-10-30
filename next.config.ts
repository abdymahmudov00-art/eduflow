import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
    // Кабинеты защищены на клиенте (токены в localStorage), сервер их не рендерит —
    // автопроверку «мгновенной навигации» отключаем, проверяются только сегменты с `export const instant`
    instantInsights: {
      validationLevel: "manual-warning",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,

  // FastAPI различает /users и /users/, поэтому слэш в конце не трогаем.
  // Запросы /api/... проксирует src/app/api/[...path]/route.ts (адрес бэкенда — переменная API_URL)
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
