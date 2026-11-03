import { apiFetch } from "./client";
import type {
  AddStatusRequest,
  ApiIssue,
  ApiProject,
  ApiSprint,
  Bootstrap,
  CarryOverRequest,
  Comment,
  CommentPage,
  CompletedSprint,
  CreateIssueRequest,
  CreateProjectRequest,
  MoveIssueRequest,
  ProjectSnapshot,
  StartSprintRequest,
  UpdateIssueRequest,
  UpdateProjectRequest,
  UpdateStatusRequest,
} from "./types";

/*
 * Typed wrappers for the tracker inside a workspace: projects, workflow, issues, sprints and comments. Contract: the
 * API's docs/INTEGRATION.md §6. Issues are addressed by key (DEV-104), everything else by UUID; all of them reject
 * with ApiError / NetworkError.
 */

const ws = (slug: string, path: string) => `/workspaces/${encodeURIComponent(slug)}${path}`;
const project = (slug: string, key: string, path = "") => ws(slug, `/projects/${encodeURIComponent(key)}${path}`);
const issue = (slug: string, key: string, path = "") => ws(slug, `/issues/${encodeURIComponent(key)}${path}`);
const sprint = (slug: string, id: string, path = "") => ws(slug, `/sprints/${encodeURIComponent(id)}${path}`);

/* ------------------------------------------------------------------ loading */

/** Once per workspace: who you are there, its config and every project's summary. */
export const getBootstrap = (slug: string) => apiFetch<Bootstrap>(ws(slug, "/bootstrap"));

/** One project with all its sprints and its open issues in rank order (not paginated). */
export const getProjectSnapshot = (slug: string, key: string) => apiFetch<ProjectSnapshot>(project(slug, key, "/snapshot"));

/* ----------------------------------------------------------------- projects */

/** `201`: the project with the default workflow; you become its lead. */
export const createProject = (slug: string, body: CreateProjectRequest) =>
  apiFetch<ApiProject>(ws(slug, "/projects"), { method: "POST", body });

export const updateProject = (slug: string, key: string, body: UpdateProjectRequest) =>
  apiFetch<ApiProject>(project(slug, key), { method: "PATCH", body });

/** Admins. Its sprints and issues go too. */
export const deleteProject = (slug: string, key: string) => apiFetch<void>(project(slug, key), { method: "DELETE" });

/* ----------------------------------------------------------------- workflow */

// Admins. Each answers with the whole project: replace the cached workflow with `project.workflow`.

export const addStatus = (slug: string, key: string, body: AddStatusRequest) =>
  apiFetch<ApiProject>(project(slug, key, "/statuses"), { method: "POST", body });

export const updateStatus = (slug: string, key: string, id: string, body: UpdateStatusRequest) =>
  apiFetch<ApiProject>(project(slug, key, `/statuses/${encodeURIComponent(id)}`), { method: "PATCH", body });

/** Every status id, exactly once, in the new left-to-right order. */
export const reorderStatuses = (slug: string, key: string, statusIds: string[]) =>
  apiFetch<ApiProject>(project(slug, key, "/statuses/order"), { method: "PUT", body: { statusIds } });

/** `moveTo` is required when the column still has issues. */
export const deleteStatus = (slug: string, key: string, id: string, moveTo: string) =>
  apiFetch<ApiProject>(project(slug, key, `/statuses/${encodeURIComponent(id)}`), { method: "DELETE", query: { moveTo } });

/* ------------------------------------------------------------------- issues */

/** `201`: at the top of the ranking, with the next key from the project's counter. */
export const createIssue = (slug: string, key: string, body: CreateIssueRequest) =>
  apiFetch<ApiIssue>(project(slug, key, "/issues"), { method: "POST", body });

export const updateIssue = (slug: string, key: string, body: UpdateIssueRequest) =>
  apiFetch<ApiIssue>(issue(slug, key), { method: "PATCH", body });

/** New column (floats to the top), new container (goes to the end) and/or a place before another issue. */
export const moveIssue = (slug: string, key: string, body: MoveIssueRequest) =>
  apiFetch<ApiIssue>(issue(slug, key, "/move"), { method: "POST", body });

export const deleteIssue = (slug: string, key: string) => apiFetch<void>(issue(slug, key), { method: "DELETE" });

/** Every comment on an issue, oldest first, in the API's order. */
export async function listComments(slug: string, key: string): Promise<Comment[]> {
  const comments: Comment[] = [];
  let cursor: string | null = null;
  do {
    const page: CommentPage = await apiFetch<CommentPage>(issue(slug, key, "/comments"), { query: { limit: 100, cursor } });
    comments.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return comments;
}

/** Members and admins. */
export const addComment = (slug: string, key: string, body: string) =>
  apiFetch<Comment>(issue(slug, key, "/comments"), { method: "POST", body: { body } });

/* ------------------------------------------------------------------ sprints */

/** `201`: `Sprint {n+1}`, planned. */
export const createSprint = (slug: string, key: string) =>
  apiFetch<ApiSprint>(project(slug, key, "/sprints"), { method: "POST" });

export const updateSprint = (slug: string, id: string, body: { name?: string; goal?: string }) =>
  apiFetch<ApiSprint>(sprint(slug, id), { method: "PATCH", body });

/** Planned sprints only (`SPRINT_NOT_PLANNED`); their issues return to the backlog. */
export const deleteSprint = (slug: string, id: string) => apiFetch<void>(sprint(slug, id), { method: "DELETE" });

/** Planned only; one active sprint per project (`SPRINT_ALREADY_ACTIVE`). */
export const startSprint = (slug: string, id: string, body: StartSprintRequest) =>
  apiFetch<ApiSprint>(sprint(slug, id, "/start"), { method: "POST", body });

/** Active only. Unfinished issues move as `carryOver` says; re-fetch the snapshot afterwards. */
export const completeSprint = (slug: string, id: string, carryOver: CarryOverRequest) =>
  apiFetch<CompletedSprint>(sprint(slug, id, "/complete"), { method: "POST", body: { carryOver } });

/* --------------------------------------------------------------------- demo */

/** Admins. Restores the workspace's sample projects (DEV, BIL, MOB) and keeps the ones people created. */
export const resetSampleData = (slug: string) => apiFetch<void>(ws(slug, "/demo/reset"), { method: "POST" });
