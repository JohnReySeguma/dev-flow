import {
  ArrowDown,
  ArrowUp,
  Bookmark,
  Bug,
  CircleCheck as TaskIcon,
  Flame,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  GitPullRequestDraft,
  Minus,
  type LucideIcon,
} from "lucide-react";
import type { GitLink, IssueType, Priority } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";

export const TYPE_STYLES: Record<IssueType, { icon: LucideIcon; label: string; className: string }> = {
  story: { icon: Bookmark, label: "Story", className: "text-emerald-400" },
  bug: { icon: Bug, label: "Bug", className: "text-red-400" },
  task: { icon: TaskIcon, label: "Task", className: "text-sky-400" },
};

export function TypeIcon({ type, className }: { type: IssueType; className?: string }) {
  const { icon: Icon, label, className: tone } = TYPE_STYLES[type];
  return (
    <span title={label} className="inline-flex shrink-0">
      <Icon aria-hidden className={cn("size-3.5", tone, className)} strokeWidth={2.25} />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Story-point chip; renders a dash for unestimated issues. */
export function EstimateChip({ points }: { points: number | null }) {
  return (
    <span
      title={points === null ? "Not estimated" : `${points} story points`}
      className={cn(
        "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 font-mono text-[10.5px] font-medium ring-1 ring-inset",
        points === null ? "text-zinc-600 ring-line-strong" : "bg-raised text-zinc-300 ring-line-strong",
      )}
    >
      {points ?? "–"}
    </span>
  );
}

export const PRIORITY_STYLES: Record<
  Priority,
  { icon: LucideIcon; label: string; text: string; badge: string; dot: string }
> = {
  urgent: {
    icon: Flame,
    label: "Urgent",
    text: "text-red-400",
    badge: "bg-red-500/12 text-red-400 ring-red-500/25",
    dot: "bg-red-500",
  },
  high: {
    icon: ArrowUp,
    label: "High",
    text: "text-orange-400",
    badge: "bg-orange-500/12 text-orange-400 ring-orange-500/25",
    dot: "bg-orange-500",
  },
  medium: {
    icon: Minus,
    label: "Medium",
    text: "text-yellow-400",
    badge: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
    dot: "bg-yellow-400",
  },
  low: {
    icon: ArrowDown,
    label: "Low",
    text: "text-sky-400",
    badge: "bg-sky-500/10 text-sky-400 ring-sky-500/20",
    dot: "bg-sky-400",
  },
};

export function PriorityBadge({
  priority,
  showLabel = false,
}: {
  priority: Priority;
  showLabel?: boolean;
}) {
  const { icon: Icon, label, badge } = PRIORITY_STYLES[priority];
  return (
    <span
      title={`${label} priority`}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1 text-[11px] font-medium ring-1 ring-inset",
        badge,
        showLabel && "pr-1.5",
      )}
    >
      <Icon aria-hidden className="size-3" strokeWidth={2.5} />
      {showLabel ? label : <span className="sr-only">{label} priority</span>}
    </span>
  );
}

const TAG_TONES = [
  "text-violet-300 bg-violet-500/10 ring-violet-500/20",
  "text-sky-300 bg-sky-500/10 ring-sky-500/20",
  "text-emerald-300 bg-emerald-500/10 ring-emerald-500/20",
  "text-amber-300 bg-amber-500/10 ring-amber-500/20",
  "text-pink-300 bg-pink-500/10 ring-pink-500/20",
  "text-teal-300 bg-teal-500/10 ring-teal-500/20",
  "text-indigo-300 bg-indigo-500/10 ring-indigo-500/20",
] as const;

/** Stable tone per tag name so the same tag reads the same everywhere. */
function toneFor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
  return TAG_TONES[hash % TAG_TONES.length];
}

export function TagChip({ tag }: { tag: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center rounded-md px-1.5 text-[11px] font-medium ring-1 ring-inset",
        toneFor(tag),
      )}
    >
      {tag}
    </span>
  );
}

const PR_STYLES = {
  open: { icon: GitPullRequest, className: "text-emerald-400", label: "Open" },
  draft: { icon: GitPullRequestDraft, className: "text-zinc-400", label: "Draft" },
  merged: { icon: GitMerge, className: "text-violet-400", label: "Merged" },
} as const;

export function GitBadge({ link }: { link: GitLink }) {
  const base =
    "inline-flex h-5 items-center gap-1 rounded-md border border-line-strong bg-canvas/60 px-1.5 font-mono text-[11px] text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100";

  if (link.kind === "commit") {
    return (
      <span title={`Commit ${link.sha}`} className={base}>
        <GitCommitHorizontal aria-hidden className="size-3 text-zinc-400" />
        {link.sha.slice(0, 7)}
      </span>
    );
  }

  const { icon: Icon, className, label } = PR_STYLES[link.state];
  return (
    <span title={`${label} pull request #${link.number}`} className={base}>
      <Icon aria-hidden className={cn("size-3", className)} />
      PR #{link.number}
    </span>
  );
}
