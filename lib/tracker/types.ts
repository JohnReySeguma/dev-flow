/**
 * Domain model. The process it encodes:
 *
 *   Project ── owns a Workflow (ordered statuses, each in a category)
 *     │
 *     ├─ Backlog: issues with `sprintId === null`, ranked by array order
 *     ├─ Sprints: planned → active (one per project) → completed
 *     │     the board shows only the active sprint's issues
 *     └─ Completing a sprint snapshots a report and carries unfinished
 *        issues back to the backlog or into another sprint.
 */

export type Priority = "urgent" | "high" | "medium" | "low";
export type IssueType = "story" | "bug" | "task";

/** Categories give custom statuses shared meaning (e.g. what counts as done). */
export type StatusCategory = "todo" | "in_progress" | "done";

export type WorkflowStatus = {
  id: string;
  name: string;
  category: StatusCategory;
};

export type Project = {
  id: string;
  key: string;
  name: string;
  description: string;
  /** Tailwind gradient classes for the project icon. */
  color: string;
  leadId: string;
  workflow: WorkflowStatus[];
  nextIssueNumber: number;
  createdAt: string;
};

export type SprintStatus = "planned" | "active" | "completed";

export type SprintReport = {
  committedPoints: number;
  completedPoints: number;
  completedIssues: number;
  carriedOverIssues: number;
};

export type Sprint = {
  id: string;
  projectId: string;
  number: number;
  name: string;
  goal: string;
  status: SprintStatus;
  startAt: string | null;
  endAt: string | null;
  /** Points in the sprint at the moment it started. */
  committedPoints: number | null;
  completedAt: string | null;
  report: SprintReport | null;
};

export type GitLink =
  | { kind: "pr"; number: number; state: "open" | "merged" | "draft" }
  | { kind: "commit"; sha: string };

export type Issue = {
  /** Human-readable key, e.g. DEV-104. */
  id: string;
  projectId: string;
  /** Null = in the backlog. */
  sprintId: string | null;
  statusId: string;
  type: IssueType;
  priority: Priority;
  title: string;
  description: string;
  assigneeId: string | null;
  tags: string[];
  git?: GitLink;
  /** Story points; null = not estimated. */
  estimate: number | null;
  comments: number;
  createdAt: string;
  updatedAt: string;
  dueAt?: string;
  /** Set when the issue enters a done-category status. */
  resolvedAt: string | null;
};

export type TrackerState = {
  version: 1;
  projects: Project[];
  sprints: Sprint[];
  issues: Issue[];
};

export const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "urgent", label: "Urgent" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

export const ISSUE_TYPES: { id: IssueType; label: string }[] = [
  { id: "story", label: "Story" },
  { id: "bug", label: "Bug" },
  { id: "task", label: "Task" },
];

export const STATUS_CATEGORIES: { id: StatusCategory; label: string }[] = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done", label: "Done" },
];

export const ESTIMATES = [1, 2, 3, 5, 8, 13] as const;
