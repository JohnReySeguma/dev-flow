"use client";

import { useSyncExternalStore } from "react";
import { CURRENT_USER_ID } from "@/lib/members";
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
 * A tiny client store. There is no backend: state lives in memory and is
 * mirrored to localStorage so the demo survives reloads. The server render
 * (and hydration) uses a seed pinned to a fixed date; the browser then swaps in
 * persisted state or a seed relative to the real clock.
 */

const STORAGE_KEY = "devflow:tracker:v1";
const SERVER_NOW = Date.parse("2026-11-01T09:00:00Z");
const DAY = 86_400_000;

const serverSnapshot = createSeed(SERVER_NOW);
let state: TrackerState | null = null;
const listeners = new Set<() => void>();

function load(): TrackerState {
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
  state ??= load();
  return state;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(update: (s: TrackerState) => TrackerState) {
  state = update(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or privacy mode: keep working in memory.
  }
  listeners.forEach((l) => l());
}

export function useTracker(): TrackerState {
  return useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);
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

export function createIssue(projectId: string, input: NewIssue): string {
  let id = "";
  commit((s) => {
    const project = projectById(s, projectId);
    id = `${project.key}-${project.nextIssueNumber}`;
    const timestamp = nowIso();
    const issue: Issue = {
      id,
      projectId,
      sprintId: input.sprintId,
      statusId: input.statusId ?? defaultStatusId(project),
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
}

/** Board drop: change status and float the card to the top of its new column. */
export function moveIssueToStatus(id: string, statusId: string) {
  commit((s) => {
    const issue = s.issues.find((i) => i.id === id);
    if (!issue || issue.statusId === statusId) return s;
    const moved = { ...withStatus(projectById(s, issue.projectId), issue, statusId), updatedAt: nowIso() };
    return { ...s, issues: [moved, ...s.issues.filter((i) => i.id !== id)] };
  });
}

/** Backlog/sprint planning: move between containers and/or re-rank. */
export function moveIssueToSprint(id: string, sprintId: string | null, beforeId?: string) {
  commit((s) => {
    const issue = s.issues.find((i) => i.id === id);
    if (!issue) return s;
    return { ...s, issues: reorder(s.issues, { ...issue, sprintId, updatedAt: nowIso() }, beforeId) };
  });
}

export function deleteIssue(id: string) {
  commit((s) => ({ ...s, issues: s.issues.filter((i) => i.id !== id) }));
}

/* ---------------------------------------------------------------- sprints */

export function createSprint(projectId: string): string {
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

export function updateSprint(id: string, patch: Partial<Pick<Sprint, "name" | "goal">>) {
  commit((s) => ({ ...s, sprints: s.sprints.map((sp) => (sp.id === id ? { ...sp, ...patch } : sp)) }));
}

/** Planned sprints only; their issues go back to the top of the backlog. */
export function deleteSprint(id: string) {
  commit((s) => ({
    ...s,
    sprints: s.sprints.filter((sp) => sp.id !== id),
    issues: s.issues.map((i) => (i.sprintId === id ? { ...i, sprintId: null } : i)),
  }));
}

export function startSprint(id: string, options: { name: string; goal: string; durationDays: number }) {
  commit((s) => {
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
}

/** Where unfinished issues go when a sprint is completed. */
export type CarryOver = { kind: "backlog" } | { kind: "sprint"; sprintId: string } | { kind: "new-sprint" };

export function completeSprint(id: string, carryOver: CarryOver) {
  const target =
    carryOver.kind === "new-sprint"
      ? createSprint(getSnapshot().sprints.find((sp) => sp.id === id)?.projectId ?? "")
      : carryOver.kind === "sprint"
        ? carryOver.sprintId
        : null;

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
}

/* --------------------------------------------------------------- workflow */

export function addStatus(projectId: string, name: string, category: StatusCategory) {
  commit((s) =>
    mapProject(s, projectId, (p) => {
      const status = { id: uid("status"), name, category };
      // Keep the board readable left→right: insert before the first done status.
      const doneIndex = p.workflow.findIndex((st) => st.category === "done");
      const at = category === "done" || doneIndex === -1 ? p.workflow.length : doneIndex;
      return { ...p, workflow: [...p.workflow.slice(0, at), status, ...p.workflow.slice(at)] };
    }),
  );
}

export function updateStatus(projectId: string, statusId: string, patch: { name?: string; category?: StatusCategory }) {
  commit((s) => {
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
}

export function moveStatus(projectId: string, statusId: string, direction: -1 | 1) {
  commit((s) =>
    mapProject(s, projectId, (p) => {
      const index = p.workflow.findIndex((st) => st.id === statusId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= p.workflow.length) return p;
      const workflow = [...p.workflow];
      [workflow[index], workflow[target]] = [workflow[target], workflow[index]];
      return { ...p, workflow };
    }),
  );
}

/** Deletes a status, moving its issues into `fallbackStatusId`. */
export function deleteStatus(projectId: string, statusId: string, fallbackStatusId: string) {
  commit((s) => {
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
  commit((s) => {
    const id = uid("p");
    const project: Project = {
      id,
      key: input.key.toUpperCase(),
      name: input.name,
      description: input.description,
      color: PROJECT_COLORS[s.projects.length % PROJECT_COLORS.length],
      leadId: CURRENT_USER_ID,
      workflow: DEFAULT_WORKFLOW_NAMES.map((st) => ({ ...st, id: uid("status") })),
      nextIssueNumber: 1,
      createdAt: nowIso(),
    };
    return { ...s, projects: [...s.projects, project] };
  });
}

export function updateProject(projectId: string, patch: Partial<Pick<Project, "name" | "description">>) {
  commit((s) => mapProject(s, projectId, (p) => ({ ...p, ...patch })));
}

export function deleteProject(projectId: string) {
  commit((s) => ({
    ...s,
    projects: s.projects.filter((p) => p.id !== projectId),
    sprints: s.sprints.filter((sp) => sp.projectId !== projectId),
    issues: s.issues.filter((i) => i.projectId !== projectId),
  }));
}

export function resetDemoData() {
  commit(() => createSeed(Date.now()));
}
