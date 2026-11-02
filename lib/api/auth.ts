import { apiFetch, apiRequest } from "./client";
import { API_URL } from "./config";
import type {
  AccessToken,
  AccessTokenPage,
  AuthMe,
  CreateAccessTokenRequest,
  CreatedAccessToken,
  LoginRequest,
  OAuthProvider,
  SignupRequest,
  UpdateProfileRequest,
  UserProfile,
} from "./types";

/*
 * Typed wrappers for the authentication, profile and access-token endpoints (API v0.2.0).
 * Contract: the API's docs/INTEGRATION.md §5. All of them reject with ApiError / NetworkError.
 */

/* ----------------------------------------------------------------- session */

/** Session check: `401 UNAUTHENTICATED` means signed out. */
export const getSession = () => apiFetch<AuthMe>("/auth/me");

export const login = (body: LoginRequest) => apiFetch<AuthMe>("/auth/login", { method: "POST", body });

export const signup = (body: SignupRequest) => apiFetch<AuthMe>("/auth/signup", { method: "POST", body });

/** Revokes the session and clears its cookies; also succeeds when already signed out. */
export const logout = () => apiFetch<void>("/auth/logout", { method: "POST" });

/** Always `202`, whether or not the account exists. */
export const requestPasswordReset = (email: string) =>
  apiFetch<void>("/auth/password/forgot", { method: "POST", body: { email } });

/** `400 RESET_TOKEN_INVALID` for an unknown, used or expired link. Signs every session out. */
export const resetPassword = (token: string, password: string) =>
  apiFetch<void>("/auth/password/reset", { method: "POST", body: { token, password } });

/** Only a relative path on this site; anything else falls back to /projects (as the API does). */
export function safeRedirect(path: string | null | undefined): string {
  return path && path.startsWith("/") && !path.startsWith("//") ? path : "/projects";
}

/** OAuth is a full-page navigation to the API, never a fetch. */
export function oauthUrl(provider: OAuthProvider, redirect: string) {
  return `${API_URL}/auth/oauth/${provider}?redirect=${encodeURIComponent(safeRedirect(redirect))}`;
}

/* ----------------------------------------------------------------- profile */

export type VersionedProfile = { profile: UserProfile; etag: string | null };

export async function getProfile(): Promise<VersionedProfile> {
  const { data, headers } = await apiRequest<UserProfile>("/me");
  return { profile: data, etag: headers.get("ETag") };
}

/** With an ETag, a teammate's or another tab's newer change answers `412 CONFLICT_STALE` instead of being overwritten. */
export async function updateProfile(patch: UpdateProfileRequest, etag: string | null): Promise<VersionedProfile> {
  const { data, headers } = await apiRequest<UserProfile>("/me", {
    method: "PATCH",
    body: patch,
    headers: etag ? { "If-Match": etag } : undefined,
  });
  return { profile: data, etag: headers.get("ETag") };
}

/* ------------------------------------------------------------ access tokens */

export const listAccessTokens = (cursor?: string | null) =>
  apiFetch<AccessTokenPage>("/me/tokens", { query: { limit: 100, cursor } });

/** The secret is in this response only; afterwards just `lastFour` is available. */
export const createAccessToken = (body: CreateAccessTokenRequest) =>
  apiFetch<CreatedAccessToken>("/me/tokens", { method: "POST", body });

export const revokeAccessToken = (id: AccessToken["id"]) =>
  apiFetch<void>(`/me/tokens/${encodeURIComponent(id)}`, { method: "DELETE" });
