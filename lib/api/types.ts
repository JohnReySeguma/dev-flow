import type { components } from "./schema";

/*
 * Readable names for the generated OpenAPI types (lib/api/schema.d.ts, from the API's v1.0.1 spec).
 * Regenerate with `npm run api:types`; never edit schema.d.ts by hand.
 */

type Schemas = components["schemas"];

/** `GET /config`: which optional features the server has enabled. */
export type PublicConfig = Schemas["PublicConfig"];

/** RFC 9457 problem+json body returned by every non-2xx response. */
export type ProblemDetails = Schemas["ProblemDetails"];

/** Stable error codes; switch on these, never on `title` or `detail`. */
export type ErrorCode = ProblemDetails["code"];

/** One invalid field of a `422 VALIDATION_FAILED` response. */
export type FieldError = NonNullable<ProblemDetails["errors"]>[number];

/* Authentication, profile and access tokens (API v0.2.0). */

/** `GET /auth/me`, and the body of sign-in, sign-up and invite acceptance. */
export type AuthMe = Schemas["AuthMe"];
/** The account. Since API v2 it has no role: roles belong to a workspace membership. */
export type UserProfile = Schemas["UserProfile"];
export type SignupRequest = Schemas["SignupRequest"];
export type LoginRequest = Schemas["LoginRequest"];
export type UpdateProfileRequest = Schemas["UpdateProfileRequest"];
export type AccessToken = Schemas["AccessToken"];
export type AccessTokenPage = Schemas["AccessTokenPage"];
export type CreatedAccessToken = Schemas["CreatedAccessToken"];
export type CreateAccessTokenRequest = Schemas["CreateAccessTokenRequest"];
export type OAuthProvider = "github" | "google";

/* Workspaces, members and invites (API v2: many workspaces, a role in each). */

/** `{ id, slug, name, role, isDemo }`: a workspace with the caller's role in it. */
export type Workspace = Schemas["Workspace"];
/** One entry of `/auth/me`'s `workspaces`. */
export type WorkspaceSummary = AuthMe["workspaces"][number];
export type Role = Workspace["role"];
export type WorkspacePage = Schemas["WorkspacePage"];
export type CreateWorkspaceRequest = Schemas["CreateWorkspaceRequest"];
export type RenameWorkspaceRequest = Schemas["RenameWorkspaceRequest"];
export type TeamMember = Schemas["TeamMember"];
export type TeamMemberPage = Schemas["TeamMemberPage"];
export type InviteRequest = Schemas["InviteRequest"];
export type InvitePreview = Schemas["InvitePreview"];
export type AcceptInviteRequest = Schemas["AcceptInviteRequest"];

/* Projects, workflow, issues, sprints and comments, all inside a workspace. */

/** `{ me, workspace, config, projects }`, loaded once per workspace. */
export type Bootstrap = Schemas["Bootstrap"];
/** `{ project, sprints, issues }`: one project, its sprints by number and its open issues in rank order. */
export type ProjectSnapshot = Schemas["ProjectSnapshot"];
export type ApiProject = Schemas["Project"];
export type ApiIssue = Schemas["Issue"];
export type ApiSprint = Schemas["Sprint"];
export type CreateProjectRequest = Schemas["CreateProjectRequest"];
export type UpdateProjectRequest = Schemas["UpdateProjectRequest"];
export type CreateIssueRequest = Schemas["CreateIssueRequest"];
export type UpdateIssueRequest = Schemas["UpdateIssueRequest"];
export type MoveIssueRequest = Schemas["MoveIssueRequest"];
export type AddStatusRequest = Schemas["AddStatusRequest"];
export type UpdateStatusRequest = Schemas["UpdateStatusRequest"];
export type StartSprintRequest = Schemas["StartSprintRequest"];
export type CarryOverRequest = Schemas["CarryOver"];
export type CompletedSprint = Schemas["CompletedSprint"];
export type Comment = Schemas["Comment"];
export type CommentPage = Schemas["CommentPage"];

/* Reports. */

/** One point per sprint day; `remaining` is null for days still ahead. */
export type Burndown = Schemas["Burndown"];
/** The most recent completed sprints, oldest first. */
export type Velocity = Schemas["Velocity"];
/** Completed sprints, newest first, paged. */
export type SprintHistory = Schemas["SprintHistory"];
