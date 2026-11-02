import { API_URL } from "./config";
import { NetworkError, toApiError } from "./errors";

export type ApiRequest = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON. */
  body?: unknown;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

/**
 * Calls the DevFlow API from the browser. Every API request goes through here.
 *
 * - Always sends `credentials: "include"`: the session cookies are scoped to the API and the browser
 *   attaches them only when asked (localhost:3000 and :4000 are the same site).
 * - Resolves with the parsed JSON body, or `undefined` for `204 No Content`.
 * - Rejects with `ApiError` for any non-2xx answer and `NetworkError` when there is no answer at all.
 *   An aborted request rejects with the browser's `AbortError` unchanged.
 *
 * Only call it in API mode (`isApiMode()`), from client components.
 */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<T> {
  if (API_URL === null) throw new Error(`apiFetch("${path}") called in demo mode`);

  const url = new URL(`${API_URL}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [name, value] of Object.entries(request.query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(name, String(value));
  }

  const headers: Record<string, string> = { Accept: "application/json, application/problem+json", ...request.headers };
  if (request.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(url, {
      method: request.method ?? "GET",
      credentials: "include",
      headers,
      body: request.body === undefined ? undefined : JSON.stringify(request.body),
      signal: request.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new NetworkError(error);
  }

  // Step 2 (API v0.2.0): a 401 TOKEN_EXPIRED triggers one shared POST /auth/refresh, then a single retry.
  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
