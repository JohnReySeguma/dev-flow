import { EstimateChip, GitBadge, PriorityBadge, TagChip, TypeIcon } from "@/components/board/badges";
import { Avatar } from "@/components/ui/avatar";
import { MEMBERS_BY_ID } from "@/lib/members";
import { createSeed } from "@/lib/tracker/seed";
import type { StatusCategory } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<StatusCategory, string> = {
  todo: "border border-dashed border-zinc-500",
  in_progress: "bg-amber-400",
  done: "bg-emerald-400",
};

// The DEV project's active sprint from the demo seed, two cards per column.
const seed = createSeed(Date.parse("2026-11-01T09:00:00Z"));
const project = seed.projects[0];
const sprint = seed.sprints.find((s) => s.projectId === project.id && s.status === "active");
const COLUMNS = project.workflow.map((status) => ({
  ...status,
  issues: seed.issues.filter((i) => i.sprintId === sprint?.id && i.statusId === status.id).slice(0, 2),
}));

/**
 * Static, non-interactive rendering of the board for the landing page hero,
 * built from the real card primitives so the marketing shot never drifts.
 */
export function BoardPreview() {
  return (
    <div aria-hidden className="relative select-none">
      <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(124,108,255,0.28),transparent_70%)] blur-2xl" />

      <div className="overflow-hidden rounded-xl border border-line-strong bg-surface/90 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_40px_120px_-30px_rgba(0,0,0,0.9)]">
        <div className="flex h-9 items-center gap-2 border-b border-line bg-elevated/80 px-3">
          <span className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
            <span className="size-2.5 rounded-full bg-zinc-700" />
          </span>
          <span className="mx-auto truncate rounded-md border border-line bg-canvas/60 px-3 py-0.5 font-mono text-[10px] text-zinc-500">
            devflow/projects/DEV/board
          </span>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-0.5 text-[10px] font-medium text-emerald-300 sm:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            {sprint?.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 md:grid-cols-4">
          {COLUMNS.map((column, columnIndex) => (
            <div key={column.id} className={cn("flex min-w-0 flex-col gap-2 rounded-lg border border-line/70 bg-canvas/50 p-2", columnIndex > 1 && "hidden md:flex")}>
              <div className="flex items-center gap-2 px-1 py-0.5">
                <span className={cn("size-2 rounded-full", STATUS_DOT[column.category])} />
                <span className="truncate text-[11px] font-semibold text-zinc-200">{column.name}</span>
                <span className="text-[10px] tabular-nums text-zinc-500">{column.issues.length}</span>
              </div>
              {column.issues.map((issue) => {
                const assignee = issue.assigneeId ? MEMBERS_BY_ID[issue.assigneeId] : null;
                return (
                  <div key={issue.id} className="min-w-0 rounded-md border border-zinc-800 bg-elevated p-2.5">
                    <div className="flex items-center gap-1.5">
                      <TypeIcon type={issue.type} className="size-3" />
                      <span className="font-mono text-[10px] text-zinc-500">{issue.id}</span>
                      <span className="ml-auto">
                        <PriorityBadge priority={issue.priority} />
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug font-medium text-zinc-200">{issue.title}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {issue.git && <GitBadge link={issue.git} />}
                      {issue.tags.slice(0, 1).map((tag) => (
                        <TagChip key={tag} tag={tag} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                      {assignee && <Avatar member={assignee} size="xs" />}
                      <EstimateChip points={issue.estimate} />
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canvas to-transparent" />
    </div>
  );
}
