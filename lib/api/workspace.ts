import { apiFetch } from "./client";
import { API_URL } from "./config";
import type {
  AcceptInviteRequest,
  AuthMe,
  CreateWorkspaceRequest,
  GitHubStatus,
  InvitePreview,
  InviteRequest,
  Role,
  TeamMember,
  TeamMemberPage,
  Workspace,
} from "./types";

/*
 * Typed wrappers for workspaces, members and invites (API v2). Everything inside a workspace is addressed by its
 * slug: /workspaces/{slug}/…. Contract: the API's docs/INTEGRATION.md §1.2, §5.7, §5.9 and §5.10. All of them
 * reject with ApiError / NetworkError; a workspace you are not a member of answers 404 NOT_FOUND.
 */

const ws = (slug: string, path = "") => `/workspaces/${encodeURIComponent(slug)}${path}`;

/* --------------------------------------------------------------- workspaces */

/** `201`: the new workspace, with you as its admin. `sampleData` (default true) copies DEV, BIL and MOB into it. */
export const createWorkspace = (body: CreateWorkspaceRequest) => apiFetch<Workspace>("/workspaces", { method: "POST", body });

/** The workspace with the caller's role in it. */
export const getWorkspace = (slug: string) => apiFetch<Workspace>(ws(slug));

/** Admins; the slug stays the same, so links keep working. */
export const renameWorkspace = (slug: string, name: string) =>
  apiFetch<Workspace>(ws(slug), { method: "PATCH", body: { name } });

/** Admins. Its projects, invites, tokens and memberships are gone; accounts stay. No undo. */
export const deleteWorkspace = (slug: string) => apiFetch<void>(ws(slug), { method: "DELETE" });

/** Anyone. The last admin gets `409 LAST_ADMIN`. */
export const leaveWorkspace = (slug: string) => apiFetch<void>(ws(slug, "/leave"), { method: "POST" });

/* ------------------------------------------------------------------ members */

/** Active members and pending invites, every page, in the API's order. */
export async function listMembers(slug: string): Promise<TeamMember[]> {
  const members: TeamMember[] = [];
  let cursor: string | null = null;
  do {
    const page: TeamMemberPage = await apiFetch<TeamMemberPage>(ws(slug, "/members"), { query: { limit: 100, cursor } });
    members.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return members;
}

const memberPath = (slug: string, id: string) => ws(slug, `/members/${encodeURIComponent(id)}`);

/** Admins only. `CANNOT_CHANGE_OWN_ROLE`, `LAST_ADMIN`. */
export const changeRole = (slug: string, id: string, role: Role) =>
  apiFetch<TeamMember>(memberPath(slug, id), { method: "PATCH", body: { role } });

/** Ends a membership (the account stays) or revokes an invite. `CANNOT_REMOVE_SELF`, `LAST_ADMIN`. */
export const removeMember = (slug: string, id: string) => apiFetch<void>(memberPath(slug, id), { method: "DELETE" });

/** `201` with the pending member. `ALREADY_MEMBER`; `EMAIL_DELIVERY_FAILED` keeps the invite (offer Resend). */
export const inviteMember = (slug: string, body: InviteRequest) =>
  apiFetch<TeamMember>(ws(slug, "/invites"), { method: "POST", body });

/** Emails a fresh link; the previous one stops working. */
export const resendInvite = (slug: string, id: string) =>
  apiFetch<TeamMember>(ws(slug, `/invites/${encodeURIComponent(id)}/resend`), { method: "POST" });

/* ------------------------------------------------------------------ invites */

const invitePath = (token: string) => `/invites/${encodeURIComponent(token)}`;

/** `INVITE_INVALID` for a link that is unknown, used, replaced or older than 7 days. */
export const getInvite = (token: string) => apiFetch<InvitePreview>(invitePath(token));

/**
 * An existing account joins the inviting workspace (signed-in session, no body) and gets it back with its role.
 * `INVITE_EMAIL_MISMATCH` when signed in with another email, `ALREADY_MEMBER`, `DEMO_ACCOUNT_LOCKED`.
 */
export const joinInvite = (token: string) => apiFetch<Workspace>(`${invitePath(token)}/join`, { method: "POST" });

/** `201`: a new account in that workspace, signed in. `EMAIL_TAKEN` if the email already has an account. */
export const acceptInvite = (token: string, body: AcceptInviteRequest) =>
  apiFetch<AuthMe>(`${invitePath(token)}/accept`, { method: "POST", body });

/* ------------------------------------------------------------------- github */

/** Any member: whether the server can link GitHub, and the installations linked to this workspace. */
export const getGitHubStatus = (slug: string) => apiFetch<GitHubStatus>(ws(slug, "/integrations/github"));

/**
 * Admins: where to send the browser (a navigation, never a fetch) to install the GitHub App and link it here. The API
 * comes back to `redirect` with `?github=linked` or `?github_error=<code>`.
 */
export const gitHubInstallUrl = (slug: string, redirect: string) =>
  `${API_URL}${ws(slug, "/integrations/github/install")}?redirect=${encodeURIComponent(redirect)}`;

/** Admins. The app stays installed on GitHub; uninstalling it there disconnects it too. */
export const disconnectGitHub = (slug: string, installationId: number) =>
  apiFetch<void>(ws(slug, `/integrations/github/installations/${installationId}`), { method: "DELETE" });
