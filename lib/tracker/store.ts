"use client";

import { useSyncExternalStore } from "react";
import { isApiMode } from "@/lib/api/config";
import { errorMessage } from "@/lib/api/errors";
import * as api from "@/lib/api/tracker";
import type { ApiIssue, ApiProject, ApiSprint, ProjectSnapshot, TeamMember } from "@/lib/api/types";
import { listMembers } from "@/lib/api/workspace";
import { CURRENT_USER_ID, type Member } from "@/lib/members";
import { DEFAULT_WORKFLOW_NAMES, createSeed } from "./seed";
import { cannotDeleteStatusReason, categoryOf, defaultStatusId, sumPoints } from "./selectors";
import type {
  Issue,
  IssueType,
  Priority,
  Project,
  Sprint,
  StatusCategory,
  TrackerState,
} from "./types";

/*
 * A tiny client store with one interface and two sources.
 *
 * Demo mode: there is no backend. State lives in memory and is mirrored to localStorage so the demo survives reloads.
 * The server render (and hydration) uses a seed pinned to a fixed date; the browser then swaps in persisted state or
 * a seed relative to the real clock.
 *
 * API mode: the state is the current workspace, loaded with /bootstrap and one snapshot per project (INTEGRATION
 * §6.1). Every change is applied locally at once, then sent to the API through a queue that runs one request at a
 * time, so later requests see the ids earlier ones created. Locally created sprints, statuses and projects keep a
 * temporary id until the project is re-fetched; `ids` translates them for the API in the meantime. When a request
 * fails, its message is reported and the project is re-fetched, which rolls the screen back to the server's truth.
 */

const STORAGE_KEY = "devflow:tracker:v1";
const SERVER_NOW = Date.parse("2026-11-01T09:00:00Z");
const DAY = 86_400_000;
const API = isApiMode();

const EMPTY: TrackerState = { version: 1, projects: [], sprints: [], issues: [] };
const serverSnapshot = API ? EMPTY : createSeed(SERVER_NOW);
let state: TrackerState | null = null;
const listeners = new Set<() => void>();

function loadLocal(): TrackerState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TrackerState;
      if (parsed?.version === 1 && Array.isArray(parsed.projects)) return parsed;
    }
  } catch {
    // Storage blocked or corrupt: fall through to a fresh seed.
  }
  return createSeed(Date.now());
}

function getSnapshot() {
  state ??= API ? EMPTY : loadLocal();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const emit = () => listeners.forEach((l) => l());

/** Applies `update`; returns whether anything changed. Only demo mode persists. */
function commit(update: (s: TrackerState) => TrackerState): boolean {
  const before = getSnapshot();
  state = update(before);
  if (state === before) return false;
  if (!API) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota or privacy mode: keep working in memory.
    }
  }
  emit();
  return true;
}

export function useTracker(): TrackerState {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
}

/* --------------------------------------------------------- API: loading */

export type TrackerLoad =
  | { status: "idle" }
  | { status: "loading"; slug: string }
  | { status: "ready"; slug: string }
  | { status: "error"; slug: string; error: unknown };

const IDLE: TrackerLoad = { status: "idle" };
let loadState: TrackerLoad = IDLE;
/** The workspace whose data `state` holds (API mode). */
let workspace: string | null = null;
let members: Member[] = [];
let meId: string | null = null;
/** Bumped by every load, so a slow load for a workspace you already left is dropped. */
let generation = 0;

/** API mode: whether the current workspace's data is there yet. */
export function useTrackerLoad(): TrackerLoad {
  return useSyncExternalStore(subscribe, () => loadState, () => IDLE);
}

/** API mode: the workspace's active members, for assignees and avatars. */
export function useWorkspaceMembers(): Member[] {
  return useSyncExternalStore(subscribe, () => members, () => members);
}

const toProject = (p: ApiProject): Project => ({ ...p, leadId: p.leadId ?? "" });
const toSprint = (s: ApiSprint): Sprint => s as Sprint;
const toIssue = (i: ApiIssue): Issue => i as Issue;

function toMember(m: TeamMember): Member {
  return { id: m.id, name: m.name, handle: m.email.split("@")[0], initials: m.initials, gradient: m.gradient, presence: "offline" };
}

function fromSnapshots(snapshots: ProjectSnapshot[]): TrackerState {
  return {
    version: 1,
    projects: snapshots.map((s) => toProject(s.project)),
    sprints: snapshots.flatMap((s) => s.sprints.map(toSprint)),
    issues: snapshots.flatMap((s) => s.issues.map(toIssue)),
  };
}

async function fetchWorkspace(slug: string) {
  const [boot, team] = await Promise.all([api.getBootstrap(slug), listMembers(slug)]);
  const snapshots = await Promise.all(boot.projects.map((p) => api.getProjectSnapshot(slug, p.key)));
  return { me: boot.me.id, data: fromSnapshots(snapshots), team: team.filter((m) => m.status === "active").map(toMember) };
}

/**
 * API mode: makes `slug` the store's workspace and loads it (once; `force` loads again). Switching workspaces drops
 * the previous one's data straight away, so nothing carries over.
 */
export async function loadWorkspace(slug: string, { force = false } = {}): Promise<void> {
  if (!API) return;
  if (!force && workspace === slug && (loadState.status === "ready" || loadState.status === "loading")) return;
  const run = ++generation;
  if (workspace !== slug) {
    workspace = slug;
    state = EMPTY;
    members = [];
    ids.clear();
  }
  loadState = { status: "loading", slug };
  emit();
  try {
    const loaded = await fetchWorkspace(slug);
    if (run !== generation) return;
    state = loaded.data;
    members = loaded.team;
    meId = loaded.me;
    loadState = { status: "ready", slug };
  } catch (error) {
    if (run !== generation) return;
    loadState = { status: "error", slug, error };
  }
  emit();
}

/** Re-fetches everything without showing a loading state (after a reset, or a failure that touched the workspace). */
async function reloadQuietly(slug: string) {
  const run = ++generation;
  try {
    const loaded = await fetchWorkspace(slug);
    if (run !== generation || workspace !== slug) return;
    state = loaded.data;
    members = loaded.team;
    emit();
  } catch (error) {
    if (run === generation) report(error);
  }
}

/* -------------------------------------------------- API: errors to show */

export type TrackerError = { id: number; message: string };
let lastError: TrackerError | null = null;
let errorCount = 0;

/** The latest refused change, until dismissed. */
export function useTrackerError(): TrackerError | null {
  return useSyncExternalStore(subscribe, () => lastError, () => null);
}

export function dismissTrackerError() {
  lastError = null;
  emit();
}

function report(error: unknown) {
  lastError = { id: ++errorCount, message: errorMessage(error) };
  emit();
}

/* ------------------------------------------- API: the queue of requests */

/** Temporary local id (or predicted issue key) → the API's. */
const ids = new Map<string, string>();
const real = (id: string) => ids.get(id) ?? id;
const realOrNull = (id: string | null) => (id === null ? null : real(id));

let queue: Promise<unknown> = Promise.resolve();
let pending = 0;
/** Project keys to re-fetch once the queue is empty; "*" = the whole workspace. */
const resyncs = new Set<string>();
/** Local edits per project key, so a re-fetch never overwrites a change made while it was in flight. */
const edits = new Map<string, number>();

type Remote = { resync?: boolean };

/**
 * API mode: sends one change for the project `key` after every earlier one. Resolves with whether it succeeded; a
 * failure is reported and the project re-fetched (rolling the optimistic change back).
 */
function remote(key: string, call: (slug: string) => Promise<unknown>, { resync = false }: Remote = {}): Promise<boolean> {
  const slug = workspace;
  if (!API || !slug) return Promise.resolve(true);
  edits.set(key, (edits.get(key) ?? 0) + 1);
  pending++;
  const done = queue.then(async () => {
    try {
      await call(slug);
      if (resync) resyncs.add(key);
      return true;
    } catch (error) {
      report(error);
      resyncs.add(key);
      return false;
    } finally {
      pending--;
      if (pending === 0) void flushResyncs(slug);
    }
  });
  queue = done;
  return done;
}

async function flushResyncs(slug: string) {
  const targets = [...resyncs];
  resyncs.clear();
  if (workspace !== slug || targets.length === 0) return;
  if (targets.includes("*")) return reloadQuietly(slug);
  for (const key of targets) {
    if (!getSnapshot().projects.some((p) => p.key === key)) continue; // deleted (or never created) meanwhile
    const before = edits.get(key) ?? 0;
    try {
      const snapshot = await api.getProjectSnapshot(slug, key);
      if (workspace !== slug) return;
      // Edited meanwhile: those requests are queued and will trigger another re-fetch when they finish.
      if (pending > 0 || (edits.get(key) ?? 0) !== before) {
        resyncs.add(key);
        continue;
      }
      applySnapshot(key, snapshot);
    } catch (error) {
      report(error);
    }
  }
}

function applySnapshot(key: string, snapshot: ProjectSnapshot) {
  commit((s) => {
    const local = s.projects.find((p) => p.key === key);
    if (!local) return s;
    return {
      ...s,
      projects: s.projects.map((p) => (p.id === local.id ? toProject(snapshot.project) : p)),
      sprints: [...s.sprints.filter((sp) => sp.projectId !== local.id), ...snapshot.sprints.map(toSprint)],
      issues: [...s.issues.filter((i) => i.projectId !== local.id), ...snapshot.issues.map(toIssue)],
    };
  });
}

/* ---------------------------------------------------------------- helpers */

const nowIso = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;

function mapProject(s: TrackerState, projectId: string, fn: (p: Project) => Project): TrackerState {
  return { ...s, projects: s.projects.map((p) => (p.id === projectId ? fn(p) : p)) };
}

function projectById(s: TrackerState, projectId: string) {
  const project = s.projects.find((p) => p.id === projectId);
  if (!project) throw new Error(`Unknown project ${projectId}`);
  return project;
}

const keyOfProject = (projectId: string) => getSnapshot().projects.find((p) => p.id === projectId)?.key ?? "";

function keyOfIssue(issueId: string) {
  const issue = getSnapshot().issues.find((i) => i.id === issueId);
  return issue ? keyOfProject(issue.projectId) : "";
}

function keyOfSprint(sprintId: string) {
  const sprint = getSnapshot().sprints.find((sp) => sp.id === sprintId);
  return sprint ? keyOfProject(sprint.projectId) : "";
}

/** Applies a status change, keeping `resolvedAt` in step with done-ness. */
function withStatus(project: Project, issue: Issue, statusId: string): Issue {
  const wasDone = categoryOf(project, issue.statusId) === "done";
  const isDone = categoryOf(project, statusId) === "done";
  return {
    ...issue,
    statusId,
    resolvedAt: isDone ? (wasDone ? issue.resolvedAt : nowIso()) : null,
  };
}

/** Moves `id` so it sits before `beforeId` (or at the end) in the global array order. */
function reorder(issues: Issue[], moved: Issue, beforeId?: string): Issue[] {
  const rest = issues.filter((i) => i.id !== moved.id);
  const index = beforeId ? rest.findIndex((i) => i.id === beforeId) : -1;
  if (index === -1) return [...rest, moved];
  return [...rest.slice(0, index), moved, ...rest.slice(index)];
}

/* ----------------------------------------------------------------- issues */

export type NewIssue = {
  title: string;
  type: IssueType;
  priority: Priority;
  assigneeId: string | null;
  estimate: number | null;
  sprintId: string | null;
  statusId?: string;
  description?: string;
};

/** Returns the new issue's key (in API mode, the key the project's counter will give it). */
export function createIssue(projectId: string, input: NewIssue): string {
  let id = "";
  let statusId = "";
  commit((s) => {
    const project = projectById(s, projectId);
    id = `${project.key}-${project.nextIssueNumber}`;
    statusId = input.statusId ?? defaultStatusId(project);
    const timestamp = nowIso();
    const issue: Issue = {
      id,
      projectId,
      sprintId: input.sprintId,
      statusId,
      type: input.type,
      priority: input.priority,
      title: input.title,
      description: input.description ?? "",
      assigneeId: input.assigneeId,
      tags: [],
      estimate: input.estimate,
      comments: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      resolvedAt: null,
    };
    const withIssue = { ...s, issues: [issue, ...s.issues] };
    return mapProject(withIssue, projectId, (p) => ({ ...p, nextIssueNumber: p.nextIssueNumber + 1 }));
  });
  const key = keyOfProject(projectId);
  void remote(key, async (slug) => {
    const created = await api.createIssue(slug, key, {
      title: input.title,
      description: input.description ?? "",
      type: input.type,
      priority: input.priority,
      assigneeId: input.assigneeId,
      estimate: input.estimate,
      sprintId: realOrNull(input.sprintId),
      statusId: real(statusId),
    });
    // Someone else took that number meanwhile: map ours to theirs and re-fetch to show the real key.
    if (created.id !== id) {
      ids.set(id, created.id);
      resyncs.add(key);
    }
  });
  return id;
}

export type IssuePatch = Partial<
  Pick<Issue, "title" | "description" | "type" | "priority" | "assigneeId" | "estimate" | "statusId" | "sprintId">
>;

export function updateIssue(id: string, patch: IssuePatch) {
  commit((s) => ({
    ...s,
    issues: s.issues.map((issue) => {
      if (issue.id !== id) return issue;
      const project = projectById(s, issue.projectId);
      const { statusId, ...rest } = patch;
      const next = { ...issue, ...rest, updatedAt: nowIso() };
      return statusId && statusId !== issue.statusId ? withStatus(project, next, statusId) : next;
    }),
  }));
  void remote(keyOfIssue(id), (slug) =>
    api.updateIssue(slug, real(id), {
      ...patch,
      statusId: patch.statusId === undefined ? undefined : real(patch.statusId),
      sprintId: patch.sprintId === undefined ? undefined : realOrNull(patch.sprintId),
    }),
  );
}

/** Board drop: change status and float the card to the top of its new column. */
export function moveIssueToStatus(id: string, statusId: string) {
  const changed = commit((s) => {
    const issue = s.issues.find((i) => i.id === id);
    if (!issue || issue.statusId === statusId) return s;
    const moved = { ...withStatus(projectById(s, issue.projectId), issue, statusId), updatedAt: nowIso() };
    return { ...s, issues: [moved, ...s.issues.filter((i) => i.id !== id)] };
  });
  if (changed) void remote(keyOfIssue(id), (slug) => api.moveIssue(slug, real(id), { statusId: real(statusId) }));
}

/** Backlog/sprint planning: move between containers and/or re-rank. */
export function moveIssueToSprint(id: string, sprintId: string | null, beforeId?: string) {
  const changed = commit((s) => {
    const issue = s.issues.find((i) => i.id === id);
    if (!issue) return s;
    return { ...s, issues: reorder(s.issues, { ...issue, sprintId, updatedAt: nowIso() }, beforeId) };
  });
  if (changed) {
    void remote(keyOfIssue(id), (slug) =>
      api.moveIssue(slug, real(id), { sprintId: realOrNull(sprintId), beforeIssueKey: beforeId && real(beforeId) }),
    );
  }
}

export function deleteIssue(id: string) {
  const key = keyOfIssue(id);
  commit((s) => ({ ...s, issues: s.issues.filter((i) => i.id !== id) }));
  void remote(key, (slug) => api.deleteIssue(slug, real(id)));
}

/** A comment was added through the API: count it on the card. */
export function countComment(id: string) {
  commit((s) => ({ ...s, issues: s.issues.map((i) => (i.id === id ? { ...i, comments: i.comments + 1 } : i)) }));
}

/* ---------------------------------------------------------------- sprints */

function addLocalSprint(projectId: string): string {
  let id = "";
  commit((s) => {
    const number = Math.max(0, ...s.sprints.filter((sp) => sp.projectId === projectId).map((sp) => sp.number)) + 1;
    id = uid("sprint");
    const sprint: Sprint = {
      id,
      projectId,
      number,
      name: `Sprint ${number}`,
      goal: "",
      status: "planned",
      startAt: null,
      endAt: null,
      committedPoints: null,
      completedAt: null,
      report: null,
    };
    return { ...s, sprints: [...s.sprints, sprint] };
  });
  return id;
}

export function createSprint(projectId: string): string {
  const id = addLocalSprint(projectId);
  const key = keyOfProject(projectId);
  void remote(
    key,
    async (slug) => {
      const created = await api.createSprint(slug, key);
      ids.set(id, created.id);
    },
    { resync: true },
  );
  return id;
}

export function updateSprint(id: string, patch: Partial<Pick<Sprint, "name" | "goal">>) {
  commit((s) => ({ ...s, sprints: s.sprints.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)) }));
  void remote(keyOfSprint(id), (slug) => api.updateSprint(slug, real(id), patch));
}

/** Planned sprints only; their issues go back to the top of the backlog. */
export function deleteSprint(id: string) {
  const key = keyOfSprint(id);
  commit((s) => ({
    ...s,
    sprints: s.sprints.filter((sp) => sp.id !== id),
    issues: s.issues.map((i) => (i.sprintId === id ? { ...i, sprintId: null } : i)),
  }));
  void remote(key, (slug) => api.deleteSprint(slug, real(id)), { resync: true });
}

export function startSprint(id: string, options: { name: string; goal: string; durationDays: number }) {
  const changed = commit((s) => {
    const sprint = s.sprints.find((sp) => sp.id === id);
    if (!sprint || s.sprints.some((sp) => sp.projectId === sprint.projectId && sp.status === "active")) return s;
    const start = Date.now();
    const committedPoints = sumPoints(s.issues.filter((i) => i.sprintId === id));
    return {
      ...s,
      sprints: s.sprints.map((sp) =>
        sp.id === id
          ? {
              ...sp,
              name: options.name,
              goal: options.goal,
              status: "active",
              startAt: new Date(start).toISOString(),
              endAt: new Date(start + options.durationDays * DAY).toISOString(),
              committedPoints,
            }
          : sp,
      ),
    };
  });
  if (changed) void remote(keyOfSprint(id), (slug) => api.startSprint(slug, real(id), options), { resync: true });
}

/** Where unfinished issues go when a sprint is completed. */
export type CarryOver = { kind: "backlog" } | { kind: "sprint"; sprintId: string } | { kind: "new-sprint" };

export function completeSprint(id: string, carryOver: CarryOver) {
  const projectId = getSnapshot().sprints.find((sp) => sp.id === id)?.projectId ?? "";
  // The API creates the new sprint itself, so only add it locally.
  const target =
    carryOver.kind === "new-sprint" ? addLocalSprint(projectId) : carryOver.kind === "sprint" ? carryOver.sprintId : null;

  commit((s) => {
    const sprint = s.sprints.find((sp) => sp.id === id);
    if (!sprint) return s;
    const project = projectById(s, sprint.projectId);
    const issues = s.issues.filter((i) => i.sprintId === id);
    const done = issues.filter((i) => categoryOf(project, i.statusId) === "done");
    const open = issues.filter((i) => categoryOf(project, i.statusId) !== "done");
    const openIds = new Set(open.map((i) => i.id));

    return {
      ...s,
      sprints: s.sprints.map((sp) =>
        sp.id === id
          ? {
              ...sp,
              status: "completed",
              completedAt: nowIso(),
              report: {
                committedPoints: sp.committedPoints ?? sumPoints(issues),
                completedPoints: sumPoints(done),
                completedIssues: done.length,
                carriedOverIssues: open.length,
              },
            }
          : sp,
      ),
      issues: s.issues.map((i) => (openIds.has(i.id) ? { ...i, sprintId: target } : i)),
    };
  });
  void remote(
    keyOfProject(projectId),
    (slug) =>
      api.completeSprint(slug, real(id), carryOver.kind === "sprint" ? { kind: "sprint", sprintId: real(carryOver.sprintId) } : carryOver),
    { resync: true },
  );
}

/* --------------------------------------------------------------- workflow */

export function addStatus(projectId: string, name: string, category: StatusCategory) {
  const id = uid("status");
  commit((s) =>
    mapProject(s, projectId, (p) => {
      const status = { id, name, category };
      // Keep the board readable left→right: insert before the first done status.
      const doneIndex = p.workflow.findIndex((st) => st.category === "done");
      const at = category === "done" || doneIndex === -1 ? p.workflow.length : doneIndex;
      return { ...p, workflow: [...p.workflow.slice(0, at), status, ...p.workflow.slice(at)] };
    }),
  );
  const key = keyOfProject(projectId);
  void remote(
    key,
    async (slug) => {
      const known = new Set(projectById(getSnapshot(), projectId).workflow.map((st) => real(st.id)));
      const project = await api.addStatus(slug, key, { name, category });
      const created = project.workflow.find((st) => !known.has(st.id));
      if (created) ids.set(id, created.id);
    },
    { resync: true },
  );
}

export function updateStatus(projectId: string, statusId: string, patch: { name?: string; category?: StatusCategory }) {
  const changed = commit((s) => {
    const project = projectById(s, projectId);
    const current = project.workflow.find((st) => st.id === statusId);
    if (!current) return s;
    // Changing a category must not strand the workflow without a to-do or done status.
    if (patch.category && patch.category !== current.category && current.category !== "in_progress") {
      const remaining = project.workflow.filter((st) => st.category === current.category && st.id !== statusId);
      if (remaining.length === 0) return s;
    }
    const next = mapProject(s, projectId, (p) => ({
      ...p,
      workflow: p.workflow.map((st) => (st.id === statusId ? { ...st, ...patch } : st)),
    }));
    if (!patch.category || patch.category === current.category) return next;
    // Issues sitting in a status that became (or stopped being) done resolve accordingly.
    const nowDone = patch.category === "done";
    return {
      ...next,
      issues: next.issues.map((i) =>
        i.statusId === statusId ? { ...i, resolvedAt: nowDone ? (i.resolvedAt ?? nowIso()) : null } : i,
      ),
    };
  });
  const key = keyOfProject(projectId);
  if (changed) void remote(key, (slug) => api.updateStatus(slug, key, real(statusId), patch), { resync: !!patch.category });
}

export function moveStatus(projectId: string, statusId: string, direction: -1 | 1) {
  const changed = commit((s) =>
    mapProject(s, projectId, (p) => {
      const index = p.workflow.findIndex((st) => st.id === statusId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= p.workflow.length) return p;
      const workflow = [...p.workflow];
      [workflow[index], workflow[target]] = [workflow[target], workflow[index]];
      return { ...p, workflow };
    }),
  );
  if (!changed) return;
  const key = keyOfProject(projectId);
  const order = projectById(getSnapshot(), projectId).workflow.map((st) => st.id);
  void remote(key, (slug) => api.reorderStatuses(slug, key, order.map(real)));
}

/** Deletes a status, moving its issues into `fallbackStatusId`. */
export function deleteStatus(projectId: string, statusId: string, fallbackStatusId: string) {
  const changed = commit((s) => {
    const project = projectById(s, projectId);
    if (cannotDeleteStatusReason(project, statusId) || statusId === fallbackStatusId) return s;
    const next = mapProject(s, projectId, (p) => ({ ...p, workflow: p.workflow.filter((st) => st.id !== statusId) }));
    const updated = projectById(next, projectId);
    return {
      ...next,
      issues: next.issues.map((i) =>
        i.projectId === projectId && i.statusId === statusId ? withStatus(updated, { ...i, statusId: "" }, fallbackStatusId) : i,
      ),
    };
  });
  const key = keyOfProject(projectId);
  if (changed) {
    void remote(key, (slug) => api.deleteStatus(slug, key, real(statusId), real(fallbackStatusId)), { resync: true });
  }
}

/* --------------------------------------------------------------- projects */

const PROJECT_COLORS = [
  "from-sky-500 to-cyan-500",
  "from-amber-500 to-yellow-600",
  "from-fuchsia-500 to-pink-600",
  "from-violet-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
];

export function createProject(input: { name: string; key: string; description: string }) {
  const key = input.key.toUpperCase();
  const id = uid("p");
  commit((s) => {
    const project: Project = {
      id,
      key,
      name: input.name,
      description: input.description,
      color: PROJECT_COLORS[s.projects.length % PROJECT_COLORS.length],
      leadId: (API && meId) || CURRENT_USER_ID,
      workflow: DEFAULT_WORKFLOW_NAMES.map((st) => ({ ...st, id: uid("status") })),
      nextIssueNumber: 1,
      createdAt: nowIso(),
    };
    return { ...s, projects: [...s.projects, project] };
  });
  void remote(
    key,
    async (slug) => {
      const local = projectById(getSnapshot(), id);
      const created = await api.createProject(slug, { name: input.name, key, description: input.description }).catch((error: unknown) => {
        // Refused: there is nothing on the server to re-fetch, so take the local project away again.
        commit((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id) }));
        throw error;
      });
      ids.set(id, created.id);
      // The default workflow, in the same order: map the temporary column ids for requests already queued.
      local.workflow.forEach((st, i) => created.workflow[i] && ids.set(st.id, created.workflow[i].id));
    },
    { resync: true },
  );
}

export function updateProject(projectId: string, patch: Partial<Pick<Project, "name" | "description">>) {
  commit((s) => mapProject(s, projectId, (p) => ({ ...p, ...patch })));
  const key = keyOfProject(projectId);
  void remote(key, (slug) => api.updateProject(slug, key, patch));
}

export function deleteProject(projectId: string) {
  const key = keyOfProject(projectId);
  commit((s) => ({
    ...s,
    projects: s.projects.filter((p) => p.id !== projectId),
    sprints: s.sprints.filter((sp) => sp.projectId !== projectId),
    issues: s.issues.filter((i) => i.projectId !== projectId),
  }));
  void remote(key, async (slug) => {
    try {
      await api.deleteProject(slug, key);
    } catch (error) {
      resyncs.add("*"); // the project is gone locally: only a full reload brings it back
      throw error;
    }
  });
}

/**
 * Demo mode: a fresh seed. API mode: the workspace's sample projects are restored on the server (others stay), then
 * the workspace is re-fetched. Rejects with the API's error.
 */
export async function resetDemoData(): Promise<void> {
  if (!API) {
    commit(() => createSeed(Date.now()));
    return;
  }
  const slug = workspace;
  if (!slug) return;
  let failure: unknown = null;
  const ok = await remote("*", (s) =>
    api.resetSampleData(s).catch((error: unknown) => {
      failure = error;
      throw error;
    }),
  );
  if (!ok) {
    dismissTrackerError(); // the caller shows it next to the button
    throw failure;
  }
  await reloadQuietly(slug);
}
