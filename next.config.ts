import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://51.21.181.215";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,

  // FastAPI различает /users и /users/, поэтому слэш в конце не трогаем
  skipTrailingSlashRedirect: true,

  // Браузер ходит на /api/..., Next пересылает запрос на бэкенд (без CORS)
  async rewrites() {
    return [
      { source: "/api/:path*/", destination: `${API_URL}/:path*/` },
      { source: "/api/:path*", destination: `${API_URL}/:path*` },
    ];
  },
};

export default nextConfig;
