import type { Issue, Project, Sprint, TrackerState, WorkflowStatus } from "./types";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const DEFAULT_WORKFLOW_NAMES: Omit<WorkflowStatus, "id">[] = [
  { name: "To Do", category: "todo" },
  { name: "In Progress", category: "in_progress" },
  { name: "In Review", category: "in_progress" },
  { name: "Done", category: "done" },
];

type IssueSeed = Omit<Issue, "projectId" | "description" | "createdAt" | "updatedAt" | "resolvedAt" | "dueAt"> & {
  description?: string;
  /** Days relative to now (negative = past). */
  updated: number;
  due?: number;
  resolved?: number;
};

/**
 * Demo workspace. Every timestamp is an offset from `now`, so a fresh visit
 * always shows a sprint that is mid-flight rather than one that ended months ago.
 */
export function createSeed(now: number): TrackerState {
  const at = (days: number) => new Date(now + days * DAY).toISOString();

  const projects: Project[] = [
    {
      id: "p-dev",
      key: "DEV",
      name: "DevFlow Core",
      description: "The web app: board, realtime sync, auth and the public API gateway.",
      color: "from-violet-500 to-indigo-600",
      leadId: "u-jr",
      workflow: [
        { id: "dev-todo", name: "To Do", category: "todo" },
        { id: "dev-progress", name: "In Progress", category: "in_progress" },
        { id: "dev-review", name: "In Review", category: "in_progress" },
        { id: "dev-done", name: "Done", category: "done" },
      ],
      nextIssueNumber: 134,
      createdAt: at(-180),
    },
    {
      id: "p-bil",
      key: "BIL",
      name: "Billing Service",
      description: "Subscriptions, invoicing and payment provider webhooks.",
      color: "from-emerald-500 to-teal-600",
      leadId: "u-lb",
      workflow: [
        { id: "bil-triage", name: "Triage", category: "todo" },
        { id: "bil-todo", name: "To Do", category: "todo" },
        { id: "bil-progress", name: "In Progress", category: "in_progress" },
        { id: "bil-review", name: "Code Review", category: "in_progress" },
        { id: "bil-qa", name: "QA", category: "in_progress" },
        { id: "bil-released", name: "Released", category: "done" },
      ],
      nextIssueNumber: 51,
      createdAt: at(-120),
    },
    {
      id: "p-mob",
      key: "MOB",
      name: "Mobile App",
      description: "React Native client for iOS and Android. Planning its first sprint.",
      color: "from-rose-500 to-orange-500",
      leadId: "u-am",
      workflow: [
        { id: "mob-todo", name: "To Do", category: "todo" },
        { id: "mob-progress", name: "In Progress", category: "in_progress" },
        { id: "mob-review", name: "In Review", category: "in_progress" },
        { id: "mob-done", name: "Done", category: "done" },
      ],
      nextIssueNumber: 8,
      createdAt: at(-14),
    },
  ];

  const completed = (
    projectId: string,
    number: number,
    endDaysAgo: number,
    committedPoints: number,
    completedPoints: number,
    completedIssues: number,
    carriedOverIssues: number,
    goal: string,
  ): Sprint => ({
    id: `s-${projectId}-${number}`,
    projectId,
    number,
    name: `Sprint ${number}`,
    goal,
    status: "completed",
    startAt: at(-endDaysAgo - 14),
    endAt: at(-endDaysAgo),
    committedPoints,
    completedAt: at(-endDaysAgo),
    report: { committedPoints, completedPoints, completedIssues, carriedOverIssues },
  });

  const sprints: Sprint[] = [
    completed("p-dev", 21, 48, 34, 29, 11, 2, "Public API v2 beta"),
    completed("p-dev", 22, 34, 38, 36, 13, 1, "Board performance pass"),
    completed("p-dev", 23, 20, 31, 31, 10, 0, "GitHub app installation flow"),
    completed("p-dev", 24, 6, 40, 33, 12, 3, "Realtime presence and Live Sync"),
    {
      id: "s-p-dev-25",
      projectId: "p-dev",
      number: 25,
      name: "Sprint 25",
      goal: "Ship SSO for enterprise tenants and stabilise token refresh.",
      status: "active",
      startAt: at(-6),
      endAt: at(8),
      committedPoints: null, // filled from the sprint's issues below
      completedAt: null,
      report: null,
    },
    {
      id: "s-p-dev-26",
      projectId: "p-dev",
      number: 26,
      name: "Sprint 26",
      goal: "Cycle analytics v1.",
      status: "planned",
      startAt: null,
      endAt: null,
      committedPoints: null,
      completedAt: null,
      report: null,
    },
    completed("p-bil", 7, 17, 21, 18, 7, 1, "Stripe migration cut-over"),
    {
      id: "s-p-bil-8",
      projectId: "p-bil",
      number: 8,
      name: "Sprint 8",
      goal: "Proration and dunning for self-serve plans.",
      status: "active",
      startAt: at(-3),
      endAt: at(11),
      committedPoints: null,
      completedAt: null,
      report: null,
    },
    {
      id: "s-p-mob-1",
      projectId: "p-mob",
      number: 1,
      name: "Sprint 1",
      goal: "Read-only board and push notifications.",
      status: "planned",
      startAt: null,
      endAt: null,
      committedPoints: null,
      completedAt: null,
      report: null,
    },
  ];

  const dev = (seed: IssueSeed) => toIssue("p-dev", seed);
  const bil = (seed: IssueSeed) => toIssue("p-bil", seed);
  const mob = (seed: IssueSeed) => toIssue("p-mob", seed);

  function toIssue(projectId: string, { updated, due, resolved, description = "", ...rest }: IssueSeed): Issue {
    return {
      ...rest,
      projectId,
      description,
      createdAt: at(updated - 5),
      updatedAt: at(updated),
      dueAt: due === undefined ? undefined : at(due),
      resolvedAt: resolved === undefined ? null : at(resolved),
    };
  }

  const S25 = "s-p-dev-25";
  const S26 = "s-p-dev-26";
  const B8 = "s-p-bil-8";
  const M1 = "s-p-mob-1";

  const issues: Issue[] = [
    // DEV · Sprint 25 (active)
    dev({ id: "DEV-104", sprintId: S25, statusId: "dev-progress", type: "bug", priority: "urgent", title: "OAuth refresh token rotation fails on concurrent tabs", assigneeId: "u-jr", tags: ["auth", "frontend"], git: { kind: "pr", number: 421, state: "open" }, estimate: 5, comments: 12, updated: -0.05, due: -1, description: "Two tabs refreshing at the same time both present the old refresh token; the second request is treated as reuse and revokes the whole family.\n\nUse a BroadcastChannel lock so only one tab refreshes." }),
    dev({ id: "DEV-109", sprintId: S25, statusId: "dev-progress", type: "story", priority: "high", title: "Virtualize issue list for projects with 10k+ items", assigneeId: "u-am", tags: ["frontend", "perf"], git: { kind: "pr", number: 427, state: "draft" }, estimate: 8, comments: 4, updated: -0.7, due: 2 }),
    dev({ id: "DEV-112", sprintId: S25, statusId: "dev-progress", type: "story", priority: "medium", title: "Stream cycle analytics aggregates over WebSocket channel", assigneeId: "u-ps", tags: ["realtime", "api-gateway"], git: { kind: "commit", sha: "a8f91c2" }, estimate: 5, comments: 2, updated: -2 }),
    dev({ id: "DEV-097", sprintId: S25, statusId: "dev-review", type: "bug", priority: "high", title: "Audit log export truncates multibyte actor names", assigneeId: "u-ps", tags: ["backend", "compliance"], git: { kind: "pr", number: 418, state: "open" }, estimate: 3, comments: 7, updated: -0.5, due: 1 }),
    dev({ id: "DEV-101", sprintId: S25, statusId: "dev-review", type: "story", priority: "urgent", title: "SSO: support IdP-initiated SAML login for Okta tenants", assigneeId: "u-dk", tags: ["auth", "enterprise"], git: { kind: "pr", number: 415, state: "open" }, estimate: 8, comments: 9, updated: -0.1, due: 0.3 }),
    dev({ id: "DEV-115", sprintId: S25, statusId: "dev-review", type: "task", priority: "low", title: "Replace moment.js with Temporal polyfill in date pickers", assigneeId: "u-am", tags: ["frontend", "deps"], git: { kind: "pr", number: 424, state: "open" }, estimate: 2, comments: 3, updated: -1 }),
    dev({ id: "DEV-127", sprintId: S25, statusId: "dev-todo", type: "task", priority: "medium", title: "Add retry budget to webhook dispatcher", assigneeId: "u-lb", tags: ["webhooks"], estimate: 3, comments: 1, updated: -3 }),
    dev({ id: "DEV-129", sprintId: S25, statusId: "dev-todo", type: "bug", priority: "high", title: "Flaky e2e: board filters reset after navigation", assigneeId: "u-jr", tags: ["testing", "frontend"], estimate: 2, comments: 2, updated: -1.5 }),
    dev({ id: "DEV-088", sprintId: S25, statusId: "dev-done", type: "bug", priority: "high", title: "Board drag-and-drop loses position after optimistic update", assigneeId: "u-jr", tags: ["frontend", "realtime"], git: { kind: "pr", number: 409, state: "merged" }, estimate: 3, comments: 5, updated: -4, resolved: -4 }),
    dev({ id: "DEV-092", sprintId: S25, statusId: "dev-done", type: "bug", priority: "urgent", title: "Gateway returns 502 when upstream sends chunked trailers", assigneeId: "u-lb", tags: ["api-gateway"], git: { kind: "commit", sha: "3c9d5fa" }, estimate: 5, comments: 11, updated: -2, resolved: -2 }),
    dev({ id: "DEV-094", sprintId: S25, statusId: "dev-done", type: "task", priority: "low", title: "Document personal access token scopes in API reference", assigneeId: "u-ps", tags: ["docs", "auth"], git: { kind: "pr", number: 411, state: "merged" }, estimate: 1, comments: 0, updated: -1, resolved: -1 }),
    // DEV · Sprint 26 (planned)
    dev({ id: "DEV-118", sprintId: S26, statusId: "dev-todo", type: "bug", priority: "high", title: "Rate limiter drops valid requests behind shared NAT egress", assigneeId: "u-dk", tags: ["api-gateway", "infra"], estimate: 5, comments: 6, updated: -2, due: 10 }),
    dev({ id: "DEV-123", sprintId: S26, statusId: "dev-todo", type: "task", priority: "medium", title: "Migrate session store from Redis 6 to Valkey cluster", assigneeId: "u-lb", tags: ["infra", "auth"], estimate: 8, comments: 3, updated: -3 }),
    dev({ id: "DEV-130", sprintId: S26, statusId: "dev-todo", type: "story", priority: "medium", title: "Cycle analytics: burndown and velocity endpoints", assigneeId: "u-ps", tags: ["api-gateway", "analytics"], estimate: 5, comments: 0, updated: -1 }),
    // DEV · Backlog
    dev({ id: "DEV-121", sprintId: null, statusId: "dev-todo", type: "story", priority: "low", title: "Add keyboard shortcuts cheat sheet to command palette", assigneeId: null, tags: ["frontend", "dx"], estimate: 2, comments: 1, updated: -5 }),
    dev({ id: "DEV-126", sprintId: null, statusId: "dev-todo", type: "task", priority: "medium", title: "Webhook retries should use exponential backoff with jitter", assigneeId: "u-jr", tags: ["webhooks"], git: { kind: "commit", sha: "e41b07d" }, estimate: 3, comments: 0, updated: -0.6 }),
    dev({ id: "DEV-131", sprintId: null, statusId: "dev-todo", type: "task", priority: "low", title: "Contrast audit for charts in dark mode", assigneeId: null, tags: ["a11y", "frontend"], estimate: 2, comments: 0, updated: -7 }),
    dev({ id: "DEV-132", sprintId: null, statusId: "dev-todo", type: "story", priority: "medium", title: "Link GitLab merge requests the same way as GitHub PRs", assigneeId: null, tags: ["integrations"], estimate: 8, comments: 4, updated: -9 }),
    dev({ id: "DEV-133", sprintId: null, statusId: "dev-todo", type: "story", priority: "low", title: "Export board as CSV", assigneeId: null, tags: ["export"], estimate: null, comments: 2, updated: -12 }),

    // BIL · Sprint 8 (active)
    bil({ id: "BIL-41", sprintId: B8, statusId: "bil-progress", type: "bug", priority: "urgent", title: "Stripe webhook signature check fails on clock skew", assigneeId: "u-lb", tags: ["webhooks", "stripe"], git: { kind: "pr", number: 88, state: "open" }, estimate: 3, comments: 6, updated: -0.2, due: 1 }),
    bil({ id: "BIL-44", sprintId: B8, statusId: "bil-review", type: "story", priority: "high", title: "Proration preview for mid-cycle seat changes", assigneeId: "u-am", tags: ["subscriptions"], git: { kind: "pr", number: 85, state: "open" }, estimate: 8, comments: 9, updated: -0.4 }),
    bil({ id: "BIL-45", sprintId: B8, statusId: "bil-todo", type: "story", priority: "medium", title: "Dunning emails: configurable retry schedule", assigneeId: "u-ps", tags: ["email"], estimate: 5, comments: 1, updated: -2 }),
    bil({ id: "BIL-47", sprintId: B8, statusId: "bil-qa", type: "bug", priority: "high", title: "Invoice PDF shows wrong currency symbol for JPY", assigneeId: "u-dk", tags: ["invoices", "i18n"], git: { kind: "commit", sha: "9be41d0" }, estimate: 2, comments: 3, updated: -0.8 }),
    bil({ id: "BIL-38", sprintId: B8, statusId: "bil-released", type: "task", priority: "high", title: "Idempotency keys for the charge endpoint", assigneeId: "u-jr", tags: ["api"], git: { kind: "pr", number: 81, state: "merged" }, estimate: 5, comments: 4, updated: -1, resolved: -1 }),
    bil({ id: "BIL-48", sprintId: B8, statusId: "bil-triage", type: "story", priority: "medium", title: "Validate EU VAT IDs at checkout", assigneeId: null, tags: ["tax"], estimate: 3, comments: 0, updated: -0.3 }),
    // BIL · Backlog
    bil({ id: "BIL-49", sprintId: null, statusId: "bil-triage", type: "story", priority: "low", title: "Usage-based metering prototype", assigneeId: null, tags: ["metering"], estimate: 8, comments: 2, updated: -6 }),
    bil({ id: "BIL-50", sprintId: null, statusId: "bil-triage", type: "task", priority: "low", title: "Annual plan discount codes", assigneeId: "u-lb", tags: ["subscriptions"], estimate: 3, comments: 0, updated: -4 }),

    // MOB · Sprint 1 (planned) + backlog
    mob({ id: "MOB-3", sprintId: M1, statusId: "mob-todo", type: "story", priority: "high", title: "Push notification deep links into issue view", assigneeId: "u-am", tags: ["notifications"], estimate: 5, comments: 3, updated: -2 }),
    mob({ id: "MOB-4", sprintId: M1, statusId: "mob-todo", type: "story", priority: "medium", title: "Offline queue for issue edits", assigneeId: "u-dk", tags: ["offline", "sync"], estimate: 8, comments: 1, updated: -3 }),
    mob({ id: "MOB-6", sprintId: null, statusId: "mob-todo", type: "bug", priority: "urgent", title: "Crash on Android 15 when rotating the board", assigneeId: null, tags: ["android"], estimate: 2, comments: 5, updated: -0.5 }),
    mob({ id: "MOB-5", sprintId: null, statusId: "mob-todo", type: "task", priority: "low", title: "Biometric unlock", assigneeId: null, tags: ["security"], estimate: 3, comments: 0, updated: -6 }),
    mob({ id: "MOB-7", sprintId: null, statusId: "mob-todo", type: "task", priority: "low", title: "Haptic feedback when dropping a card", assigneeId: null, tags: ["ux"], estimate: 1, comments: 0, updated: -8 }),
  ];

  // Active sprints commit to whatever they contained when they started.
  for (const sprint of sprints) {
    if (sprint.status === "active") {
      sprint.committedPoints = issues
        .filter((i) => i.sprintId === sprint.id)
        .reduce((sum, i) => sum + (i.estimate ?? 0), 0);
    }
  }

  return { version: 1, projects, sprints, issues };
}
