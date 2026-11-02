"use client";

import { CalendarClock, Clock, MessageSquare } from "lucide-react";
import type { DragEvent } from "react";
import { Avatar, UnassignedAvatar } from "@/components/ui/avatar";
import { MEMBERS_BY_ID } from "@/lib/members";
import type { Issue } from "@/lib/tracker/types";
import { useNow } from "@/lib/use-now";
import { cn, dueLabel, timeAgo, type DueState } from "@/lib/utils";
import { EstimateChip, GitBadge, PriorityBadge, TagChip, TypeIcon } from "./badges";
import type { DisplayOptions } from "./types";

const DUE_TONE: Record<DueState, string> = {
  overdue: "text-red-400",
  soon: "text-amber-400",
  later: "text-zinc-500",
};

type IssueCardProps = {
  issue: Issue;
  isDone: boolean;
  display: DisplayOptions;
  isDragging: boolean;
  onOpen: (id: string) => void;
  onDragStart: (event: DragEvent<HTMLElement>, id: string) => void;
  onDragEnd: () => void;
  /** Viewers can open cards but not move them. */
  canDrag?: boolean;
};

export function IssueCard({ issue, isDone, display, isDragging, onOpen, onDragStart, onDragEnd, canDrag = true }: IssueCardProps) {
  const now = useNow();
  const assignee = issue.assigneeId ? MEMBERS_BY_ID[issue.assigneeId] : null;
  const due = issue.dueAt && !isDone ? dueLabel(issue.dueAt, now) : null;
  const showMeta = (display.git && issue.git) || (display.tags && issue.tags.length > 0);

  return (
    <article
      tabIndex={0}
      draggable={canDrag}
      aria-roledescription={canDrag ? "Draggable issue" : undefined}
      aria-label={`${issue.id}: ${issue.title}`}
      onClick={() => onOpen(issue.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(issue.id);
        }
      }}
      onDragStart={(e) => canDrag && onDragStart(e, issue.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "group animate-card-in relative cursor-pointer rounded-lg border border-zinc-800 bg-elevated outline-none",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset,0_1px_2px_rgba(0,0,0,0.4)]",
        "transition-[border-color,background-color,box-shadow,transform,opacity] duration-150",
        "hover:-translate-y-px hover:border-zinc-700 hover:bg-raised hover:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_20px_-8px_rgba(0,0,0,0.7)]",
        "focus-visible:border-brand/60 focus-visible:ring-2 focus-visible:ring-brand/40",
        display.compact ? "p-2.5" : "p-3",
        isDragging && "rotate-[0.6deg] opacity-40",
      )}
    >
      <header className="flex items-center gap-1.5">
        <TypeIcon type={issue.type} />
        <span className="font-mono text-[11px] font-medium tracking-tight text-zinc-500">{issue.id}</span>
        <span className="ml-auto flex items-center gap-1.5">
          <PriorityBadge priority={issue.priority} />
        </span>
      </header>

      <h3
        className={cn(
          "mt-1.5 text-[13px] leading-snug font-medium text-zinc-200 transition-colors group-hover:text-white",
          display.compact ? "line-clamp-1" : "line-clamp-2",
          isDone && "text-zinc-400 line-through decoration-zinc-600 group-hover:text-zinc-300",
        )}
      >
        {issue.title}
      </h3>

      {showMeta && !display.compact && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {display.git && issue.git && <GitBadge link={issue.git} />}
          {display.tags && issue.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
        </div>
      )}

      <footer
        className={cn(
          "flex items-center gap-2.5 text-[11px] text-zinc-500",
          display.compact ? "mt-2" : "mt-3 border-t border-line pt-2.5",
        )}
      >
        {assignee ? <Avatar member={assignee} size="xs" /> : <UnassignedAvatar size="xs" />}

        {display.dates &&
          (due ? (
            <span className={cn("flex items-center gap-1", DUE_TONE[due.state])}>
              <CalendarClock aria-hidden className="size-3" />
              {due.label}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock aria-hidden className="size-3" />
              {timeAgo(issue.updatedAt, now)}
            </span>
          ))}

        <span className="ml-auto flex items-center gap-2">
          <span className={cn("flex items-center gap-1 tabular-nums", issue.comments === 0 && "opacity-50")} title={`${issue.comments} comments`}>
            <MessageSquare aria-hidden className="size-3" />
            {issue.comments}
          </span>
          <EstimateChip points={issue.estimate} />
        </span>
      </footer>
    </article>
  );
}
