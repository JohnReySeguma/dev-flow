/**
 * API mode switch. This is the only module that reads NEXT_PUBLIC_API_URL.
 *
 * Next.js inlines NEXT_PUBLIC_* values at build time (`next dev` / `next build`), so the
 * mode is fixed per build: restart the dev server after changing `.env.local`.
 * Unset or empty means demo mode: local data, and no request ever reaches the API.
 */

/** API base URL without a trailing slash, e.g. `http://localhost:4000/api/v2`; null in demo mode. */
export const API_URL: string | null = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || null;

export function isApiMode(): boolean {
  return API_URL !== null;
}
