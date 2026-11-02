"use client";

import { CalendarRange, Flag, ListTodo, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type DragEvent } from "react";
import { useProject } from "@/components/project/project-context";
import { Button, buttonStyles } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { usePermissions } from "@/lib/api/permissions";
import { CURRENT_USER_ID } from "@/lib/members";
import {
  activeSprint,
  cannotDeleteStatusReason,
  isDone,
  progressOf,
  projectSprints,
  sprintIssues,
} from "@/lib/tracker/selectors";
import {
  addStatus,
  createIssue,
  deleteStatus,
  moveIssueToStatus,
  moveStatus,
  updateIssue,
  updateStatus,
  useTracker,
} from "@/lib/tracker/store";
import { PRIORITIES, STATUS_CATEGORIES, type Issue, type Priority, type Sprint, type StatusCategory } from "@/lib/tracker/types";
import { useNow } from "@/lib/use-now";
import { cn, formatDate } from "@/lib/utils";
import { BoardToolbar } from "./board-toolbar";
import { CompleteSprintDialog } from "./complete-sprint-dialog";
import { KanbanColumn, type LaneSort } from "./kanban-column";
import type { DisplayOptions, Filters, GroupBy, Lane } from "./types";

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const EMPTY_FILTERS: Filters = { query: "", assignees: [], priorities: [], mine: false };
const DAY = 86_400_000;

function matchesFilters(issue: Issue, filters: Filters) {
  if (filters.mine && issue.assigneeId !== CURRENT_USER_ID) return false;
  if (filters.assignees.length > 0 && !filters.assignees.includes(issue.assigneeId ?? "")) return false;
  if (filters.priorities.length > 0 && !filters.priorities.includes(issue.priority)) return false;
  const q = filters.query.trim().toLowerCase();
  if (!q) return true;
  return issue.id.toLowerCase().includes(q) || issue.title.toLowerCase().includes(q) || issue.tags.some((t) => t.includes(q));
}

function sortLane(issues: Issue[], sort: LaneSort) {
  if (sort === "priority") return [...issues].sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  if (sort === "updated") return [...issues].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return issues;
}

/** The board for the project's active sprint; columns are the project's workflow. */
export function SprintBoard() {
  const { project } = useProject();
  const state = useTracker();
  const sprint = activeSprint(state, project.id);

  if (!sprint) return <NoActiveSprint />;
  return <ActiveSprintBoard key={sprint.id} sprint={sprint} issues={sprintIssues(state, sprint.id)} />;
}

function ActiveSprintBoard({ sprint, issues }: { sprint: Sprint; issues: Issue[] }) {
  const { project, openIssue } = useProject();
  // Viewers can only look; editing the workflow (columns) is for admins.
  const { canWrite, canAdmin } = usePermissions();
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupBy>("status");
  const [display, setDisplay] = useState<DisplayOptions>({ tags: true, git: true, dates: true, compact: false });
  const [laneSort, setLaneSort] = useState<Record<string, LaneSort>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [composerLane, setComposerLane] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropLane, setDropLane] = useState<string | null>(null);

  const lanes: Lane[] =
    groupBy === "status"
      ? project.workflow.map((s) => ({ key: s.id, label: s.name, category: s.category }))
      : PRIORITIES.map((p) => ({ key: p.id, label: p.label }));

  const visible = useMemo(() => issues.filter((i) => matchesFilters(i, filters)), [issues, filters]);
  const laneOf = (issue: Issue) => (groupBy === "status" ? issue.statusId : issue.priority);

  function drop(laneKey: string) {
    if (draggingId) {
      if (groupBy === "status") moveIssueToStatus(draggingId, laneKey);
      else updateIssue(draggingId, { priority: laneKey as Priority });
    }
    setDraggingId(null);
    setDropLane(null);
  }

  function quickAdd(laneKey: string, title: string) {
    createIssue(project.id, {
      title,
      type: "task",
      priority: groupBy === "priority" ? (laneKey as Priority) : "medium",
      assigneeId: CURRENT_USER_ID,
      estimate: null,
      sprintId: sprint.id,
      statusId: groupBy === "status" ? laneKey : undefined,
    });
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <SprintHeader sprint={sprint} issues={issues} />
      <BoardToolbar
        filters={filters}
        onFiltersChange={setFilters}
        groupBy={groupBy}
        onGroupByChange={(g) => {
          setGroupBy(g);
          setComposerLane(null);
        }}
        display={display}
        onDisplayChange={setDisplay}
        visibleCount={visible.length}
        totalCount={issues.length}
      />

      <div className="scroll-thin flex min-h-0 flex-1 gap-3 overflow-x-auto overscroll-x-contain px-4 py-4 sm:px-6">
        {lanes.map((lane, index) => {
          const neighbour = project.workflow[index === 0 ? 1 : index - 1];
          return (
            <KanbanColumn
              key={lane.key}
              lane={lane}
              groupBy={groupBy}
              issues={sortLane(
                visible.filter((i) => laneOf(i) === lane.key),
                laneSort[lane.key] ?? "manual",
              )}
              isDoneIssue={(issue) => isDone(project, issue)}
              display={display}
              draggingId={draggingId}
              isDropTarget={dropLane === lane.key}
              composerOpen={composerLane === lane.key}
              sort={laneSort[lane.key] ?? "manual"}
              collapsed={collapsed[lane.key] ?? false}
              canEdit={canWrite}
              statusActions={
                groupBy === "status" && canAdmin
                  ? {
                      canMoveLeft: index > 0,
                      canMoveRight: index < lanes.length - 1,
                      deleteBlockedReason: cannotDeleteStatusReason(project, lane.key),
                      onRename: (name) => updateStatus(project.id, lane.key, { name }),
                      onMove: (direction) => moveStatus(project.id, lane.key, direction),
                      onDelete: () => neighbour && deleteStatus(project.id, lane.key, neighbour.id),
                    }
                  : undefined
              }
              onOpenIssue={openIssue}
              onOpenComposer={() => {
                setCollapsed((c) => ({ ...c, [lane.key]: false }));
                setComposerLane(lane.key);
              }}
              onCloseComposer={() => setComposerLane(null)}
              onCreate={(title) => quickAdd(lane.key, title)}
              onSortChange={(sort) => setLaneSort((s) => ({ ...s, [lane.key]: sort }))}
              onToggleCollapsed={() => setCollapsed((c) => ({ ...c, [lane.key]: !c[lane.key] }))}
              onCardDragStart={(event: DragEvent<HTMLElement>, id: string) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", id);
                setDraggingId(id);
              }}
              onCardDragEnd={() => {
                setDraggingId(null);
                setDropLane(null);
              }}
              onLaneDragOver={() => setDropLane(lane.key)}
              onLaneDrop={() => drop(lane.key)}
            />
          );
        })}
        {groupBy === "status" && canAdmin && <AddColumn projectId={project.id} />}
      </div>
    </main>
  );
}

function SprintHeader({ sprint, issues }: { sprint: Sprint; issues: Issue[] }) {
  const { project } = useProject();
  const now = useNow();
  const [completing, setCompleting] = useState(false);
  const { canWrite } = usePermissions();
  const progress = progressOf(project, issues);
  const pct = progress.totalPoints ? Math.round((progress.donePoints / progress.totalPoints) * 100) : 0;
  const end = sprint.endAt ? Date.parse(sprint.endAt) : now;
  const daysLeft = Math.ceil((end - now) / DAY);

  return (
    <section aria-label="Sprint" className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-100">{sprint.name}</h2>
          <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-medium text-emerald-300 ring-1 ring-emerald-500/20 ring-inset">
            Active
          </span>
          {sprint.startAt && sprint.endAt && (
            <span className="flex items-center gap-1 text-[12px] text-zinc-500">
              <CalendarRange aria-hidden className="size-3.5" />
              {formatDate(sprint.startAt)} – {formatDate(sprint.endAt)}
            </span>
          )}
          <span className={cn("text-[12px]", daysLeft < 0 ? "text-red-400" : daysLeft <= 2 ? "text-amber-400" : "text-zinc-500")}>
            · {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? "ends today" : `${daysLeft}d left`}
          </span>
        </div>
        {sprint.goal && (
          <p className="mt-1 flex items-start gap-1.5 text-[12.5px] text-zinc-400">
            <Flag aria-hidden className="mt-0.5 size-3 shrink-0 text-zinc-500" />
            {sprint.goal}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="w-48">
          <div className="flex justify-between text-[11.5px]">
            <span className="text-zinc-500">
              {progress.doneIssues}/{progress.totalIssues} issues
            </span>
            <span className="tabular-nums text-zinc-300">
              {progress.donePoints}/{progress.totalPoints} pts
            </span>
          </div>
          <div
            role="meter"
            aria-label="Sprint progress (story points done)"
            aria-valuemin={0}
            aria-valuemax={progress.totalPoints}
            aria-valuenow={progress.donePoints}
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-raised"
          >
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {canWrite && (
          <Button variant="secondary" onClick={() => setCompleting(true)}>
            Complete sprint
          </Button>
        )}
      </div>
      <CompleteSprintDialog sprint={sprint} open={completing} onClose={() => setCompleting(false)} />
    </section>
  );
}

function AddColumn({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StatusCategory>("in_progress");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-[200px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong text-[13px] text-zinc-500 outline-none transition-colors hover:border-zinc-600 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <Plus aria-hidden className="size-3.5" /> Add column
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addStatus(projectId, name.trim(), category);
        setName("");
        setOpen(false);
      }}
      className="animate-pop-in flex h-fit w-[240px] shrink-0 flex-col gap-2 rounded-xl border border-line-strong bg-surface p-3"
    >
      <label htmlFor="new-column-name" className="text-[12px] font-medium text-zinc-300">
        Column name
      </label>
      <input
        id="new-column-name"
        autoFocus
        maxLength={24}
        value={name}
        placeholder="e.g. QA"
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="h-8 rounded-lg border border-line-strong bg-canvas px-2.5 text-[13px] text-zinc-100 outline-none focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
      />
      <label htmlFor="new-column-category" className="text-[12px] font-medium text-zinc-300">
        Counts as
      </label>
      <Select id="new-column-category" value={category} onChange={(e) => setCategory(e.target.value as StatusCategory)} className="h-8">
        {STATUS_CATEGORIES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
      <div className="mt-1 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" type="submit" variant="primary" disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </form>
  );
}

function NoActiveSprint() {
  const { project } = useProject();
  const state = useTracker();
  const next = projectSprints(state, project.id).find((s) => s.status === "planned");
  const nextCount = next ? sprintIssues(state, next.id).length : 0;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl border border-line-strong bg-elevated text-zinc-400">
        <ListTodo aria-hidden className="size-5" />
      </span>
      <h2 className="text-lg font-semibold text-zinc-100">No active sprint</h2>
      <p className="max-w-md text-[13px] leading-relaxed text-zinc-500">
        The board shows the sprint in progress. Plan one from the backlog: drag issues into a sprint, then start it.
        {next && ` ${next.name} is ready with ${nextCount} issue${nextCount === 1 ? "" : "s"}.`}
      </p>
      <Link href={`/projects/${project.key}/backlog`} className={buttonStyles({ variant: "primary", className: "mt-2" })}>
        Plan in backlog
      </Link>
    </main>
  );
}
