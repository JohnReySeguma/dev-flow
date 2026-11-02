"use client";

import { ArrowUpToLine, ChevronDown, Ellipsis, GripVertical, MoveRight, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type DragEvent, type ReactNode } from "react";
import { EstimateChip, PriorityBadge, TypeIcon } from "@/components/board/badges";
import { StatusCategoryIcon } from "@/components/board/kanban-column";
import { useProject } from "@/components/project/project-context";
import { Avatar, UnassignedAvatar } from "@/components/ui/avatar";
import { Button, buttonStyles } from "@/components/ui/button";
import { Dropdown, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/dropdown";
import { usePermissions } from "@/lib/api/permissions";
import { MEMBERS_BY_ID } from "@/lib/members";
import { backlogIssues, isDone, projectSprints, sprintIssues, statusOf, sumPoints } from "@/lib/tracker/selectors";
import { createSprint, deleteSprint, moveIssueToSprint, useTracker } from "@/lib/tracker/store";
import type { Issue, Sprint } from "@/lib/tracker/types";
import { cn, formatDate } from "@/lib/utils";
import { EditSprintDialog, StartSprintDialog } from "./sprint-dialogs";

/** Drop containers: a sprint id, or "backlog". */
type ContainerId = string;
const BACKLOG = "backlog";

type DragState = { issueId: string; overContainer: ContainerId | null; overIssueId: string | null };

export function BacklogView() {
  const { project, openCreateIssue } = useProject();
  const state = useTracker();
  const [query, setQuery] = useState("");
  const [drag, setDrag] = useState<DragState | null>(null);
  /** Viewers see the plan but can't change it: no ranking, moving, creating or starting. */
  const { canWrite } = usePermissions();

  const sprints = projectSprints(state, project.id).filter((s) => s.status !== "completed");
  const hasActive = sprints.some((s) => s.status === "active");
  const q = query.trim().toLowerCase();
  const filter = useMemo(
    () => (issues: Issue[]) => (q ? issues.filter((i) => i.id.toLowerCase().includes(q) || i.title.toLowerCase().includes(q)) : issues),
    [q],
  );

  function drop(container: ContainerId) {
    // Dropping a row onto itself is a no-op rather than "move to end".
    if (drag && drag.overIssueId !== drag.issueId) {
      moveIssueToSprint(drag.issueId, container === BACKLOG ? null : container, drag.overIssueId ?? undefined);
    }
    setDrag(null);
  }

  const dnd = {
    drag,
    canEdit: canWrite,
    onRowDragStart: (event: DragEvent<HTMLElement>, issueId: string) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", issueId);
      setDrag({ issueId, overContainer: null, overIssueId: null });
    },
    onDragOver: (container: ContainerId, overIssueId: string | null) =>
      setDrag((d) => (d && (d.overContainer !== container || d.overIssueId !== overIssueId) ? { ...d, overContainer: container, overIssueId } : d)),
    onDrop: drop,
    onDragEnd: () => setDrag(null),
  };

  const backlog = backlogIssues(state, project.id);

  return (
    <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Backlog &amp; sprint planning</h2>
            <p className="mt-0.5 text-[13px] text-zinc-500">
              Rank the backlog, drag issues into a sprint, then start it to put them on the board.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-500" />
              <label htmlFor="backlog-search" className="sr-only">
                Filter issues
              </label>
              <input
                id="backlog-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter issues…"
                className="h-8 w-44 rounded-lg border border-line bg-surface pr-2.5 pl-8 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-500 hover:border-line-strong focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
              />
            </div>
            {canWrite && (
              <Button variant="secondary" onClick={() => createSprint(project.id)}>
                <Plus aria-hidden className="size-3.5" /> Sprint
              </Button>
            )}
          </div>
        </div>

        {sprints.map((sprint) => (
          <SprintSection key={sprint.id} sprint={sprint} issues={filter(sprintIssues(state, sprint.id))} canStart={!hasActive} dnd={dnd} />
        ))}

        <IssueSection
          container={BACKLOG}
          title="Backlog"
          meta={`${backlog.length} issues · ${sumPoints(backlog)} pts`}
          issues={filter(backlog)}
          emptyText="The backlog is empty. Everything is planned!"
          actions={
            canWrite && (
              <Button size="sm" variant="ghost" onClick={() => openCreateIssue({ sprintId: null })}>
                <Plus aria-hidden className="size-3.5" /> Create issue
              </Button>
            )
          }
          dnd={dnd}
        />
      </div>
    </main>
  );
}

type Dnd = {
  drag: DragState | null;
  /** Whether the user may rank, move or create (false for viewers). */
  canEdit: boolean;
  onRowDragStart: (event: DragEvent<HTMLElement>, issueId: string) => void;
  onDragOver: (container: ContainerId, overIssueId: string | null) => void;
  onDrop: (container: ContainerId) => void;
  onDragEnd: () => void;
};

function SprintSection({ sprint, issues, canStart, dnd }: { sprint: Sprint; issues: Issue[]; canStart: boolean; dnd: Dnd }) {
  const { project, openCreateIssue } = useProject();
  const [starting, setStarting] = useState(false);
  const [editing, setEditing] = useState(false);
  const active = sprint.status === "active";

  return (
    <>
      <IssueSection
        container={sprint.id}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {sprint.name}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                active ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" : "bg-raised text-zinc-400 ring-line-strong",
              )}
            >
              {active ? "Active" : "Planned"}
            </span>
          </span>
        }
        meta={
          <>
            {active && sprint.startAt && sprint.endAt ? `${formatDate(sprint.startAt)} – ${formatDate(sprint.endAt)} · ` : ""}
            {issues.length} issues · {sumPoints(issues)} pts
            {sprint.goal && <span className="mt-0.5 block text-zinc-500">Goal: {sprint.goal}</span>}
          </>
        }
        issues={issues}
        emptyText="Drag issues here from the backlog to plan this sprint."
        actions={
          <>
            {active ? (
              <Link href={`/projects/${project.key}/board`} className={buttonStyles({ variant: "secondary", size: "sm" })}>
                Open board <MoveRight aria-hidden className="size-3.5" />
              </Link>
            ) : (
              dnd.canEdit && (
                <span title={canStart ? undefined : "Complete the active sprint first"}>
                  <Button size="sm" variant="primary" disabled={!canStart} onClick={() => setStarting(true)}>
                    Start sprint
                  </Button>
                </span>
              )
            )}
            {dnd.canEdit && (
              <Dropdown
                align="end"
                triggerLabel={`${sprint.name} options`}
                triggerClassName="rounded-md border border-transparent p-1.5 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
                trigger={<Ellipsis className="size-4" />}
              >
                {(close) => (
                  <>
                    <MenuItem
                      icon={<Plus className="size-3.5" />}
                      onSelect={() => {
                        close();
                        openCreateIssue({ sprintId: sprint.id });
                      }}
                    >
                      Create issue in sprint
                    </MenuItem>
                    <MenuItem
                      icon={<Pencil className="size-3.5" />}
                      onSelect={() => {
                        close();
                        setEditing(true);
                      }}
                    >
                      Edit name &amp; goal
                    </MenuItem>
                    {!active && (
                      <MenuItem
                        destructive
                        icon={<Trash2 className="size-3.5 text-red-400" />}
                        onSelect={() => {
                          close();
                          deleteSprint(sprint.id);
                        }}
                      >
                        Delete sprint
                      </MenuItem>
                    )}
                  </>
                )}
              </Dropdown>
            )}
          </>
        }
        dnd={dnd}
      />
      <StartSprintDialog sprint={sprint} open={starting} onClose={() => setStarting(false)} />
      <EditSprintDialog sprint={sprint} open={editing} onClose={() => setEditing(false)} />
    </>
  );
}

type IssueSectionProps = {
  container: ContainerId;
  title: ReactNode;
  meta: ReactNode;
  issues: Issue[];
  emptyText: string;
  actions: ReactNode;
  dnd: Dnd;
};

function IssueSection({ container, title, meta, issues, emptyText, actions, dnd }: IssueSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const isOver = dnd.drag?.overContainer === container;

  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      onDragOver={(e) => {
        if (!dnd.drag) return;
        e.preventDefault();
        // Over the section but not a row: append to the end.
        if (e.target === e.currentTarget || !(e.target as HTMLElement).closest("[data-issue-row]")) dnd.onDragOver(container, null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dnd.onDrop(container);
      }}
      className={cn(
        "rounded-xl border bg-surface transition-colors",
        isOver ? "border-brand/50 bg-brand-muted/20" : "border-line",
      )}
    >
      <header className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <ChevronDown aria-hidden className={cn("mt-0.5 size-4 shrink-0 text-zinc-500 transition-transform", collapsed && "-rotate-90")} />
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-zinc-100">{title}</span>
            <span className="mt-0.5 block text-[12px] text-zinc-500">{meta}</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">{actions}</div>
      </header>

      {!collapsed && (
        <ul className="border-t border-line">
          {issues.map((issue) => (
            <BacklogRow key={issue.id} issue={issue} container={container} dnd={dnd} />
          ))}
          {issues.length === 0 && <li className="px-4 py-6 text-center text-[12.5px] text-zinc-500">{emptyText}</li>}
        </ul>
      )}
    </section>
  );
}

function BacklogRow({ issue, container, dnd }: { issue: Issue; container: ContainerId; dnd: Dnd }) {
  const { project, openIssue } = useProject();
  const state = useTracker();
  const status = statusOf(project, issue.statusId);
  const assignee = issue.assigneeId ? MEMBERS_BY_ID[issue.assigneeId] : null;
  const targets = projectSprints(state, project.id).filter((s) => s.status !== "completed" && s.id !== issue.sprintId);
  const dropBefore = dnd.drag?.overIssueId === issue.id && dnd.drag.issueId !== issue.id;
  const done = isDone(project, issue);

  return (
    <li
      data-issue-row
      draggable={dnd.canEdit}
      onDragStart={(e) => dnd.canEdit && dnd.onRowDragStart(e, issue.id)}
      onDragEnd={dnd.onDragEnd}
      onDragOver={(e) => {
        if (!dnd.drag) return;
        e.preventDefault();
        dnd.onDragOver(container, issue.id);
      }}
      className={cn(
        "group relative flex items-center gap-2.5 border-b border-line px-3 py-2 last:border-b-0 hover:bg-elevated/60 sm:px-4",
        dnd.drag?.issueId === issue.id && "opacity-40",
        dropBefore && "before:absolute before:inset-x-3 before:-top-px before:h-0.5 before:rounded-full before:bg-brand",
      )}
    >
      <GripVertical aria-hidden className="hidden size-3.5 shrink-0 cursor-grab text-zinc-600 group-hover:text-zinc-400 sm:block" />
      <TypeIcon type={issue.type} />
      <button
        type="button"
        onClick={() => openIssue(issue.id)}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <span className="shrink-0 font-mono text-[11px] text-zinc-500">{issue.id}</span>
        <span className={cn("truncate text-[13px] text-zinc-200 group-hover:text-white", done && "text-zinc-500 line-through")}>{issue.title}</span>
      </button>
      {status && (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-md border border-line-strong px-1.5 py-0.5 text-[11px] text-zinc-400 md:flex">
          <StatusCategoryIcon category={status.category} className="size-3" />
          {status.name}
        </span>
      )}
      <span className="hidden sm:inline-flex">
        <PriorityBadge priority={issue.priority} />
      </span>
      <EstimateChip points={issue.estimate} />
      {assignee ? <Avatar member={assignee} size="xs" /> : <UnassignedAvatar size="xs" />}
      {dnd.canEdit && (
        <Dropdown
          align="end"
          triggerLabel={`Move ${issue.id}`}
          triggerClassName="rounded-md border border-transparent p-1 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
          trigger={<Ellipsis className="size-4" />}
        >
          {(close) => (
            <>
              <MenuLabel>Move to</MenuLabel>
              {targets.map((s) => (
                <MenuItem
                  key={s.id}
                  icon={<MoveRight className="size-3.5" />}
                  onSelect={() => {
                    close();
                    moveIssueToSprint(issue.id, s.id);
                  }}
                >
                  {s.name}
                </MenuItem>
              ))}
              {issue.sprintId !== null && (
                <MenuItem
                  icon={<MoveRight className="size-3.5" />}
                  onSelect={() => {
                    close();
                    moveIssueToSprint(issue.id, null);
                  }}
                >
                  Backlog
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem
                icon={<ArrowUpToLine className="size-3.5" />}
                onSelect={() => {
                  close();
                  const siblings = issue.sprintId ? sprintIssues(state, issue.sprintId) : backlogIssues(state, project.id);
                  const first = siblings.find((i) => i.id !== issue.id);
                  moveIssueToSprint(issue.id, issue.sprintId, first?.id);
                }}
              >
                Move to top
              </MenuItem>
            </>
          )}
        </Dropdown>
      )}
    </li>
  );
}
