// Серверный прокси к бэкенду: браузер ходит на /api/... своего сайта (https),
// а сервер Next.js пересылает запрос на API_URL (http). Так нет ни CORS, ни «смешанного контента».

const API_URL = (process.env.API_URL ?? "http://51.21.181.215").replace(/\/+$/, "");

/** Заголовки, которые нельзя пересылать как есть */
const HOP_BY_HOP = ["host", "connection", "content-length", "transfer-encoding", "keep-alive", "upgrade", "expect"];

/**
 * FastAPI отвечает редиректом на /users → /users/. Встроенный redirect: "follow" не умеет
 * переотправлять тело POST/PUT, поэтому повторяем запрос сами (не больше 3 раз, только на свой бэкенд).
 */
async function fetchFollowingRedirects(
  url: string,
  init: { method: string; headers: Headers; body?: ArrayBuffer },
): Promise<Response> {
  let current = url;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(current, { ...init, redirect: "manual", cache: "no-store" });
    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) return response;
    const next = new URL(location, current);
    // Редирект на чужой адрес не проксируем
    if (next.origin !== new URL(API_URL).origin) return response;
    current = next.toString();
  }
  return fetch(current, { ...init, redirect: "manual", cache: "no-store" });
}

async function proxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // "/api/users/?x=1" → "http://бэкенд/users/?x=1" (слэш в конце сохраняется — FastAPI его различает)
  const target = `${API_URL}${url.pathname.replace(/^\/api/, "") || "/"}${url.search}`;

  const headers = new Headers(request.headers);
  HOP_BY_HOP.forEach((name) => headers.delete(name));

  const body = request.method !== "GET" && request.method !== "HEAD" ? await request.arrayBuffer() : undefined;

  let response: Response;
  try {
    response = await fetchFollowingRedirects(target, { method: request.method, headers, body });
  } catch {
    return Response.json({ detail: "Бэкенд недоступен. Попробуйте позже" }, { status: 502 });
  }

  const responseHeaders = new Headers(response.headers);
  // fetch уже распаковал тело — эти заголовки больше не соответствуют действительности
  ["content-encoding", "content-length", "transfer-encoding", "connection"].forEach((name) =>
    responseHeaders.delete(name),
  );

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
