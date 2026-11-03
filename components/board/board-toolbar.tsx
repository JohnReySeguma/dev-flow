"use client";

import {
  ChevronDown,
  Columns3,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Dropdown, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/dropdown";
import { useTeam } from "@/lib/tracker/team";
import { PRIORITIES, type Priority } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { PRIORITY_STYLES } from "./badges";
import type { DisplayOptions, Filters, GroupBy } from "./types";

const CONTROL =
  "flex h-8 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[13px] text-zinc-300 outline-none transition-colors hover:border-line-strong hover:bg-elevated hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50";

function toggleIn<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type BoardToolbarProps = {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;
  display: DisplayOptions;
  onDisplayChange: (display: DisplayOptions) => void;
  visibleCount: number;
  totalCount: number;
};

export function BoardToolbar({
  filters,
  onFiltersChange,
  groupBy,
  onGroupByChange,
  display,
  onDisplayChange,
  visibleCount,
  totalCount,
}: BoardToolbarProps) {
  const set = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onFiltersChange({ ...filters, [key]: value });

  const isFiltered =
    filters.query !== "" ||
    filters.assignees.length > 0 ||
    filters.priorities.length > 0 ||
    filters.mine;

  const { members } = useTeam();
  const selectedAssignees = members.filter((m) => filters.assignees.includes(m.id));

  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-500"
          />
          <label htmlFor="board-search" className="sr-only">
            Search tasks
          </label>
          <input
            id="board-search"
            type="search"
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder="Search tasks…"
            className="h-8 w-full min-w-0 rounded-lg border border-line bg-surface pr-2.5 pl-8 text-[13px] text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 hover:border-line-strong focus:border-brand/50 focus:ring-2 focus:ring-brand/20 sm:w-56 [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        <Dropdown
          triggerLabel="Filter by assignee"
          triggerClassName={CONTROL}
          trigger={
            <>
              {selectedAssignees.length > 0 ? (
                <span className="flex -space-x-1.5">
                  {selectedAssignees.slice(0, 3).map((m) => (
                    <Avatar key={m.id} member={m} size="xs" className="ring-2 ring-surface" />
                  ))}
                </span>
              ) : (
                <User aria-hidden className="size-3.5 text-zinc-500" />
              )}
              Assignee
              {selectedAssignees.length > 0 && (
                <span className="rounded bg-brand-muted px-1 text-[11px] font-medium text-brand-hover">
                  {selectedAssignees.length}
                </span>
              )}
              <ChevronDown aria-hidden className="size-3.5 text-zinc-500" />
            </>
          }
        >
          {() => (
            <>
              <MenuLabel>Assignee</MenuLabel>
              {members.map((m) => (
                <MenuItem
                  key={m.id}
                  icon={<Avatar member={m} size="xs" className="size-4 text-[7px]" />}
                  hint={`@${m.handle}`}
                  checked={filters.assignees.includes(m.id)}
                  onSelect={() => set("assignees", toggleIn(filters.assignees, m.id))}
                >
                  {m.name}
                </MenuItem>
              ))}
              {filters.assignees.length > 0 && (
                <>
                  <MenuSeparator />
                  <MenuItem onSelect={() => set("assignees", [])}>Clear selection</MenuItem>
                </>
              )}
            </>
          )}
        </Dropdown>

        <Dropdown
          triggerLabel="Filter by priority"
          triggerClassName={CONTROL}
          trigger={
            <>
              {filters.priorities.length > 0 ? (
                <span className="flex items-center gap-0.5">
                  {filters.priorities.map((p) => (
                    <span key={p} className={cn("size-1.5 rounded-full", PRIORITY_STYLES[p].dot)} />
                  ))}
                </span>
              ) : (
                <SlidersHorizontal aria-hidden className="size-3.5 text-zinc-500" />
              )}
              Priority
              <ChevronDown aria-hidden className="size-3.5 text-zinc-500" />
            </>
          }
        >
          {() => (
            <>
              <MenuLabel>Priority</MenuLabel>
              {PRIORITIES.map(({ id, label }) => {
                const { icon: Icon, text } = PRIORITY_STYLES[id as Priority];
                return (
                  <MenuItem
                    key={id}
                    icon={<Icon className={cn("size-3.5", text)} strokeWidth={2.5} />}
                    checked={filters.priorities.includes(id)}
                    onSelect={() => set("priorities", toggleIn(filters.priorities, id))}
                  >
                    {label}
                  </MenuItem>
                );
              })}
            </>
          )}
        </Dropdown>

        <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-[13px] text-zinc-300 select-none hover:text-zinc-100">
          <button
            type="button"
            role="switch"
            aria-checked={filters.mine}
            onClick={() => set("mine", !filters.mine)}
            className={cn(
              "relative h-[18px] w-8 shrink-0 rounded-full border outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand/50",
              filters.mine ? "border-brand bg-brand" : "border-line-strong bg-raised",
            )}
          >
            <span
              className={cn(
                "absolute top-1/2 left-0.5 size-3 -translate-y-1/2 rounded-full bg-white shadow transition-transform duration-200",
                filters.mine ? "translate-x-3.5" : "translate-x-0 bg-zinc-400",
              )}
            />
          </button>
          My Issues
        </label>

        {isFiltered && (
          <button
            type="button"
            onClick={() => onFiltersChange({ query: "", assignees: [], priorities: [], mine: false })}
            className="flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-zinc-500 outline-none transition-colors hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <X aria-hidden className="size-3.5" />
            Clear
            <span className="text-zinc-600 tabular-nums">
              · {visibleCount}/{totalCount}
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
        <div
          role="radiogroup"
          aria-label="Group board by"
          className="flex h-8 items-center rounded-lg border border-line bg-surface p-0.5"
        >
          <Columns3 aria-hidden className="mx-1.5 size-3.5 text-zinc-500" />
          {(["status", "priority"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={groupBy === value}
              onClick={() => onGroupByChange(value)}
              className={cn(
                "h-full rounded-md px-2.5 text-[12px] font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                groupBy === value
                  ? "bg-raised text-zinc-100 shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {value}
            </button>
          ))}
        </div>

        <Dropdown
          align="end"
          triggerLabel="Display options"
          triggerClassName={CONTROL}
          trigger={
            <>
              <SlidersHorizontal aria-hidden className="size-3.5 text-zinc-500" />
              Display
            </>
          }
        >
          {() => (
            <>
              <MenuLabel>Card properties</MenuLabel>
              <MenuItem checked={display.git} onSelect={() => onDisplayChange({ ...display, git: !display.git })}>
                GitHub links
              </MenuItem>
              <MenuItem checked={display.tags} onSelect={() => onDisplayChange({ ...display, tags: !display.tags })}>
                Labels
              </MenuItem>
              <MenuItem checked={display.dates} onSelect={() => onDisplayChange({ ...display, dates: !display.dates })}>
                Due &amp; updated dates
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                checked={display.compact}
                onSelect={() => onDisplayChange({ ...display, compact: !display.compact })}
              >
                Compact cards
              </MenuItem>
            </>
          )}
        </Dropdown>

        <LiveSyncPill />
      </div>
    </div>
  );
}

function LiveSyncPill() {
  return (
    <div
      role="status"
      title="Connected to wss://sync.devflow.dev · realtime updates enabled"
      className="flex h-8 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] pr-3 pl-2.5 text-[12px] font-medium text-emerald-300"
    >
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
      </span>
      Live Sync
      <span className="font-mono text-[10px] font-normal text-emerald-500/70">ws</span>
    </div>
  );
}
