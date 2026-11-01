import type { Issue, Project, Sprint, StatusCategory, TrackerState } from "./types";

export function findProjectByKey(state: TrackerState, key: string) {
  const upper = key.toUpperCase();
  return state.projects.find((p) => p.key === upper) ?? null;
}

export function statusOf(project: Project, statusId: string) {
  return project.workflow.find((s) => s.id === statusId) ?? null;
}

export function categoryOf(project: Project, statusId: string): StatusCategory {
  return statusOf(project, statusId)?.category ?? "todo";
}

export function isDone(project: Project, issue: Issue) {
  return categoryOf(project, issue.statusId) === "done";
}

/** Where new issues land: the first to-do status (falling back to the first status). */
export function defaultStatusId(project: Project) {
  return (project.workflow.find((s) => s.category === "todo") ?? project.workflow[0]).id;
}

export function projectSprints(state: TrackerState, projectId: string) {
  return state.sprints.filter((s) => s.projectId === projectId).sort((a, b) => a.number - b.number);
}

export function activeSprint(state: TrackerState, projectId: string): Sprint | null {
  return state.sprints.find((s) => s.projectId === projectId && s.status === "active") ?? null;
}

export function sprintIssues(state: TrackerState, sprintId: string) {
  return state.issues.filter((i) => i.sprintId === sprintId);
}

export function backlogIssues(state: TrackerState, projectId: string) {
  return state.issues.filter((i) => i.projectId === projectId && i.sprintId === null);
}

export function sumPoints(issues: Issue[]) {
  return issues.reduce((sum, i) => sum + (i.estimate ?? 0), 0);
}

export function progressOf(project: Project, issues: Issue[]) {
  const done = issues.filter((i) => isDone(project, i));
  return {
    totalIssues: issues.length,
    doneIssues: done.length,
    totalPoints: sumPoints(issues),
    donePoints: sumPoints(done),
  };
}

/** Why a status can't be deleted, or null if it can. */
export function cannotDeleteStatusReason(project: Project, statusId: string): string | null {
  const status = statusOf(project, statusId);
  if (!status) return "Status not found.";
  if (project.workflow.length <= 2) return "A workflow needs at least two statuses.";
  const sameCategory = project.workflow.filter((s) => s.category === status.category);
  if (status.category !== "in_progress" && sameCategory.length === 1) {
    return status.category === "done"
      ? "Keep at least one Done status so sprints can be completed."
      : "Keep at least one To do status so new issues have somewhere to start.";
  }
  return null;
}
