import { API_URL } from "./config";
import { ApiError, NetworkError, toApiError } from "./errors";

export type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON. */
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type ApiResponse<T> = { data: T; status: number; headers: Headers };

/* ------------------------------------------------------------ signed-out signal */

const signedOutListeners = new Set<() => void>();

/** Called when the API says the session is gone (`401 UNAUTHENTICATED`), e.g. to send the user to /login. */
export function onSignedOut(listener: () => void) {
  signedOutListeners.add(listener);
  return () => {
    signedOutListeners.delete(listener);
  };
}

function signalSignedOut() {
  signedOutListeners.forEach((listener) => listener());
}

/* ------------------------------------------------------------------- transport */

function requireApiUrl(path: string) {
  if (API_URL === null) throw new Error(`API call "${path}" made in demo mode`);
  return API_URL;
}

function buildUrl(path: string, query: ApiRequest["query"]) {
  const url = new URL(`${requireApiUrl(path)}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [name, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  }
  return url;
}

/** One HTTP round trip; network failures become NetworkError, aborts pass through unchanged. */
async function send(url: URL, request: ApiRequest): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json, application/problem+json", ...request.headers };
  if (request.body !== undefined) headers["Content-Type"] = "application/json";
  try {
    return await fetch(url, {
      method: request.method ?? "GET",
      // The session cookies are HttpOnly and scoped to the API; the browser only sends them when asked.
      credentials: "include",
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new NetworkError(error);
  }
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/* --------------------------------------------------------------------- refresh */

/** Endpoints that must never trigger a refresh themselves. */
const NO_REFRESH = new Set(["/auth/refresh", "/auth/login", "/auth/signup", "/auth/logout"]);

let refreshing: Promise<void> | null = null;

/**
 * Renews the session cookies with `POST /auth/refresh`. Each refresh token works once and a reused one revokes
 * the session, so at most one refresh runs at a time: callers in this tab share the in-flight promise, and tabs
 * take turns through a Web Lock (each then presents the newest cookie).
 * Rejects with ApiError: `UNAUTHENTICATED` (also signalled as signed out) or `RATE_LIMITED` ("try again later").
 */
export function refreshSession(): Promise<void> {
  refreshing ??= runRefresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function runRefresh() {
  const refresh = async () => {
    const response = await send(buildUrl("/auth/refresh", undefined), { method: "POST" });
    if (response.ok) return;
    const error = await toApiError(response);
    if (error.code === "UNAUTHENTICATED") signalSignedOut();
    throw error;
  };
  if (typeof navigator !== "undefined" && navigator.locks) await navigator.locks.request("devflow:auth-refresh", refresh);
  else await refresh();
}

/* ------------------------------------------------------------------ public API */

/**
 * Calls the DevFlow API from the browser and returns the body with the status and headers (e.g. `ETag`).
 *
 * - Always sends `credentials: "include"` (localhost:3000 and :4000 are the same site, so the API's
 *   SameSite=Lax cookies flow).
 * - `401 TOKEN_EXPIRED` → one shared refresh, then a single retry.
 * - Rejects with `ApiError` for any non-2xx answer and `NetworkError` when there is no answer at all.
 *   `401 UNAUTHENTICATED` is also signalled through `onSignedOut`.
 *
 * Only call it in API mode (`isApiMode()`), from client components.
 */
export async function apiRequest<T>(path: string, request: ApiRequest = {}): Promise<ApiResponse<T>> {
  const url = buildUrl(path, request.query);
  let response = await send(url, request);

  if (!response.ok) {
    let error: ApiError = await toApiError(response);
    if (error.code === "TOKEN_EXPIRED" && !NO_REFRESH.has(path)) {
      await refreshSession();
      response = await send(url, request);
      if (response.ok) return { data: await parseBody<T>(response), status: response.status, headers: response.headers };
      error = await toApiError(response);
    }
    if (error.code === "UNAUTHENTICATED") signalSignedOut();
    throw error;
  }

  return { data: await parseBody<T>(response), status: response.status, headers: response.headers };
}

/** `apiRequest` for callers that only need the body; `undefined` for `204 No Content`. */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  return (await apiRequest<T>(path, request)).data;
}
