import { apiFetch } from "./client";
import type {
  AcceptInviteRequest,
  AuthMe,
  InvitePreview,
  InviteRequest,
  Role,
  TeamMember,
  TeamMemberPage,
  Workspace,
} from "./types";

/*
 * Typed wrappers for the workspace, member and invite endpoints (API v0.3.0).
 * Contract: the API's docs/INTEGRATION.md §5.7 and §5.9. All of them reject with ApiError / NetworkError.
 */

/** The workspace name and the caller's role. */
export const getWorkspace = () => apiFetch<Workspace>("/workspace");

/** Active members and pending invites, every page, in the API's order. */
export async function listMembers(): Promise<TeamMember[]> {
  const members: TeamMember[] = [];
  let cursor: string | null = null;
  do {
    const page: TeamMemberPage = await apiFetch<TeamMemberPage>("/workspace/members", { query: { limit: 100, cursor } });
    members.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return members;
}

const memberPath = (id: string) => `/workspace/members/${encodeURIComponent(id)}`;

/** Admins only. `CANNOT_CHANGE_OWN_ROLE`, `LAST_ADMIN`. */
export const changeRole = (id: string, role: Role) => apiFetch<TeamMember>(memberPath(id), { method: "PATCH", body: { role } });

/** Removes a member (deleting the account, immediately) or revokes an invite. `CANNOT_REMOVE_SELF`, `LAST_ADMIN`. */
export const removeMember = (id: string) => apiFetch<void>(memberPath(id), { method: "DELETE" });

/** `201` with the pending member. `ALREADY_MEMBER`; `EMAIL_DELIVERY_FAILED` keeps the invite (offer Resend). */
export const inviteMember = (body: InviteRequest) => apiFetch<TeamMember>("/workspace/invites", { method: "POST", body });

/** Emails a fresh link; the previous one stops working. */
export const resendInvite = (id: string) =>
  apiFetch<TeamMember>(`/workspace/invites/${encodeURIComponent(id)}/resend`, { method: "POST" });

const invitePath = (token: string) => `/invites/${encodeURIComponent(token)}`;

/** `INVITE_INVALID` for a link that is unknown, used, replaced or older than 7 days. */
export const getInvite = (token: string) => apiFetch<InvitePreview>(invitePath(token));

/** `201`: the account exists with the invited role and is signed in (same body and cookies as sign-up). */
export const acceptInvite = (token: string, body: AcceptInviteRequest) =>
  apiFetch<AuthMe>(`${invitePath(token)}/accept`, { method: "POST", body });
