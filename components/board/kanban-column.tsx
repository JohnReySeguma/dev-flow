"use client";

import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  ChevronsLeftRight,
  CircleCheck,
  CircleDashed,
  Clock,
  CornerDownLeft,
  Ellipsis,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, type DragEvent } from "react";
import { Dropdown, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/dropdown";
import type { Issue, Priority, StatusCategory } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { PRIORITY_STYLES } from "./badges";
import { IssueCard } from "./issue-card";
import type { DisplayOptions, GroupBy, Lane } from "./types";

export type LaneSort = "manual" | "priority" | "updated";

function InProgressIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={className}>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 4a4 4 0 0 1 0 8z" fill="currentColor" />
    </svg>
  );
}

export function StatusCategoryIcon({ category, className }: { category: StatusCategory; className?: string }) {
  if (category === "todo") return <CircleDashed aria-hidden className={cn("size-3.5 text-zinc-500", className)} strokeWidth={2.25} />;
  if (category === "done") return <CircleCheck aria-hidden className={cn("size-3.5 text-emerald-400", className)} strokeWidth={2.25} />;
  return <InProgressIcon className={cn("size-3.5 text-amber-400", className)} />;
}

function LaneIcon({ groupBy, lane }: { groupBy: GroupBy; lane: Lane }) {
  if (groupBy === "priority") {
    const { icon: Icon, text } = PRIORITY_STYLES[lane.key as Priority];
    return <Icon aria-hidden className={cn("size-3.5", text)} strokeWidth={2.5} />;
  }
  return <StatusCategoryIcon category={lane.category ?? "todo"} />;
}

/** Workflow editing hooks; only provided when lanes are workflow statuses. */
export type StatusActions = {
  canMoveLeft: boolean;
  canMoveRight: boolean;
  /** Reason the status can't be deleted, or null. */
  deleteBlockedReason: string | null;
  onRename: (name: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
};

type KanbanColumnProps = {
  lane: Lane;
  groupBy: GroupBy;
  issues: Issue[];
  isDoneIssue: (issue: Issue) => boolean;
  display: DisplayOptions;
  draggingId: string | null;
  isDropTarget: boolean;
  composerOpen: boolean;
  sort: LaneSort;
  collapsed: boolean;
  statusActions?: StatusActions;
  onOpenIssue: (id: string) => void;
  onOpenComposer: () => void;
  onCloseComposer: () => void;
  onCreate: (title: string) => void;
  onSortChange: (sort: LaneSort) => void;
  onToggleCollapsed: () => void;
  onCardDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onCardDragEnd: () => void;
  onLaneDragOver: () => void;
  onLaneDrop: () => void;
};

export function KanbanColumn({
  lane,
  groupBy,
  issues,
  isDoneIssue,
  display,
  draggingId,
  isDropTarget,
  composerOpen,
  sort,
  collapsed,
  statusActions,
  onOpenIssue,
  onOpenComposer,
  onCloseComposer,
  onCreate,
  onSortChange,
  onToggleCollapsed,
  onCardDragStart,
  onCardDragEnd,
  onLaneDragOver,
  onLaneDrop,
}: KanbanColumnProps) {
  const isDragging = draggingId !== null;
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const dropHandlers = {
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (!isDragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      onLaneDragOver();
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      onLaneDrop();
    },
  };

  if (collapsed) {
    return (
      <section
        aria-label={`${lane.label} (collapsed)`}
        {...dropHandlers}
        className={cn(
          "flex w-11 shrink-0 flex-col items-center gap-3 rounded-xl border border-line bg-surface/60 py-3 transition-colors",
          isDropTarget && "border-brand/50 bg-brand-muted",
        )}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={`Expand ${lane.label}`}
          className="rounded-md p-1 text-zinc-500 outline-none transition-colors hover:bg-raised hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <ChevronsLeftRight className="size-3.5" />
        </button>
        <LaneIcon groupBy={groupBy} lane={lane} />
        <span className="text-[13px] font-medium text-zinc-300 [writing-mode:vertical-rl]">{lane.label}</span>
        <span className="rounded-md bg-raised px-1.5 py-0.5 text-[11px] tabular-nums text-zinc-400">{issues.length}</span>
      </section>
    );
  }

  return (
    <section aria-label={lane.label} className="flex w-[290px] shrink-0 flex-col sm:w-[300px] 2xl:w-auto 2xl:min-w-[270px] 2xl:flex-1">
      <header className="flex h-10 items-center gap-2 px-1.5">
        <LaneIcon groupBy={groupBy} lane={lane} />
        {renaming && statusActions ? (
          <form
            className="min-w-0 flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              const value = new FormData(e.currentTarget).get("name")?.toString().trim();
              if (value) statusActions.onRename(value);
              setRenaming(false);
            }}
          >
            <label htmlFor={`rename-${lane.key}`} className="sr-only">
              Column name
            </label>
            <input
              id={`rename-${lane.key}`}
              name="name"
              autoFocus
              defaultValue={lane.label}
              maxLength={24}
              onBlur={(e) => e.currentTarget.form?.requestSubmit()}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(false)}
              className="h-7 w-full rounded-md border border-brand/50 bg-surface px-2 text-[13px] font-semibold text-zinc-100 outline-none ring-2 ring-brand/20"
            />
          </form>
        ) : (
          <h2 className="truncate text-[13px] font-semibold tracking-tight text-zinc-100">{lane.label}</h2>
        )}
        <span className="min-w-5 rounded-md bg-raised px-1.5 py-0.5 text-center text-[11px] font-medium tabular-nums text-zinc-400 ring-1 ring-line-strong ring-inset">
          {issues.length}
        </span>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={onOpenComposer}
            aria-label={`Quick add issue to ${lane.label}`}
            title="Quick add"
            className="rounded-md p-1.5 text-zinc-500 outline-none transition-colors hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <Plus className="size-3.5" />
          </button>
          <Dropdown
            align="end"
            triggerLabel={`${lane.label} column options`}
            triggerClassName="rounded-md border border-transparent p-1.5 text-zinc-500 outline-none transition-colors hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
            trigger={<Ellipsis className="size-3.5" />}
          >
            {(close) => (
              <>
                <MenuItem
                  icon={<Plus className="size-3.5" />}
                  onSelect={() => {
                    close();
                    onOpenComposer();
                  }}
                >
                  Add issue
                </MenuItem>
                {statusActions && (
                  <>
                    <MenuSeparator />
                    <MenuLabel>Workflow</MenuLabel>
                    <MenuItem
                      icon={<Pencil className="size-3.5" />}
                      onSelect={() => {
                        close();
                        setRenaming(true);
                      }}
                    >
                      Rename column
                    </MenuItem>
                    {statusActions.canMoveLeft && (
                      <MenuItem icon={<ArrowLeft className="size-3.5" />} onSelect={() => statusActions.onMove(-1)}>
                        Move left
                      </MenuItem>
                    )}
                    {statusActions.canMoveRight && (
                      <MenuItem icon={<ArrowRight className="size-3.5" />} onSelect={() => statusActions.onMove(1)}>
                        Move right
                      </MenuItem>
                    )}
                    <MenuItem
                      destructive
                      icon={<Trash2 className="size-3.5 text-red-400" />}
                      onSelect={() => {
                        close();
                        setConfirmingDelete(true);
                      }}
                    >
                      Delete column
                    </MenuItem>
                  </>
                )}
                <MenuSeparator />
                <MenuLabel>Sort by</MenuLabel>
                <MenuItem checked={sort === "manual"} onSelect={() => onSortChange("manual")}>
                  Manual order
                </MenuItem>
                <MenuItem icon={<ArrowDownWideNarrow className="size-3.5" />} checked={sort === "priority"} onSelect={() => onSortChange("priority")}>
                  Priority
                </MenuItem>
                <MenuItem icon={<Clock className="size-3.5" />} checked={sort === "updated"} onSelect={() => onSortChange("updated")}>
                  Last updated
                </MenuItem>
                <MenuSeparator />
                <MenuItem
                  icon={<ChevronsLeftRight className="size-3.5" />}
                  onSelect={() => {
                    close();
                    onToggleCollapsed();
                  }}
                >
                  Collapse column
                </MenuItem>
              </>
            )}
          </Dropdown>
        </div>
      </header>

      {confirmingDelete && statusActions && (
        <div role="alert" className="animate-pop-in mb-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] p-3 text-[12px]">
          {statusActions.deleteBlockedReason ? (
            <p className="text-zinc-300">{statusActions.deleteBlockedReason}</p>
          ) : (
            <p className="text-zinc-300">
              Delete “{lane.label}”?{" "}
              {issues.length > 0 && `Its ${issues.length} issue${issues.length > 1 ? "s" : ""} move to the neighbouring column.`}
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmingDelete(false)} className="rounded px-2 py-1 text-zinc-400 hover:text-zinc-100">
              {statusActions.deleteBlockedReason ? "OK" : "Cancel"}
            </button>
            {!statusActions.deleteBlockedReason && (
              <button
                type="button"
                onClick={() => {
                  setConfirmingDelete(false);
                  statusActions.onDelete();
                }}
                className="rounded bg-red-500/15 px-2 py-1 font-medium text-red-300 hover:bg-red-500/25"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      <div
        {...dropHandlers}
        className={cn(
          "scroll-thin flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto rounded-xl border p-2 transition-colors duration-150",
          "border-line/70 bg-surface/50",
          isDragging && "border-dashed border-line-strong",
          isDropTarget && "border-brand/50 bg-brand-muted/40 shadow-[inset_0_0_0_1px_var(--color-brand-muted)]",
        )}
      >
        {composerOpen && <QuickAddComposer laneLabel={lane.label} onCancel={onCloseComposer} onSubmit={onCreate} />}

        {issues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            isDone={isDoneIssue(issue)}
            display={display}
            isDragging={draggingId === issue.id}
            onOpen={onOpenIssue}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
          />
        ))}

        {issues.length === 0 && !composerOpen && (
          <div
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line-strong/70 py-8 text-center text-xs text-zinc-500",
              isDropTarget && "border-brand/50 text-zinc-300",
            )}
          >
            {isDragging ? "Drop to move here" : "No issues"}
          </div>
        )}
      </div>
    </section>
  );
}

function QuickAddComposer({ laneLabel, onCancel, onSubmit }: { laneLabel: string; onCancel: () => void; onSubmit: (title: string) => void }) {
  const [title, setTitle] = useState("");

  function submit() {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setTitle("");
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="animate-pop-in rounded-lg border border-brand/40 bg-elevated p-2.5 ring-2 ring-brand/15"
    >
      <label htmlFor={`composer-${laneLabel}`} className="sr-only">
        New issue title in {laneLabel}
      </label>
      <textarea
        id={`composer-${laneLabel}`}
        autoFocus
        rows={2}
        value={title}
        placeholder="Issue title…"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            onCancel();
          }
        }}
        onBlur={() => {
          if (!title.trim()) onCancel();
        }}
        className="w-full resize-none bg-transparent text-[13px] leading-snug text-zinc-100 outline-none placeholder:text-zinc-500"
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-zinc-500">
          <kbd className="font-sans">Esc</kbd> to cancel
        </span>
        <button
          type="submit"
          disabled={!title.trim()}
          className="flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-[11px] font-medium text-white outline-none transition-colors hover:bg-brand-hover focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-40"
        >
          Add
          <CornerDownLeft aria-hidden className="size-3" />
        </button>
      </div>
    </form>
  );
}
