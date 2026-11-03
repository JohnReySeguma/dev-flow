"use client";

import { ChartNoAxesColumn, LayoutGrid, ListTodo, Plus, Search, Settings, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { usePermissions } from "@/lib/api/permissions";
import { useTeam } from "@/lib/tracker/team";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";
import { useProject } from "./project-context";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";

const TABS: { segment: string; label: string; icon: LucideIcon }[] = [
  { segment: "board", label: "Board", icon: LayoutGrid },
  { segment: "backlog", label: "Backlog", icon: ListTodo },
  { segment: "reports", label: "Reports", icon: ChartNoAxesColumn },
  { segment: "settings", label: "Settings", icon: Settings },
];

export function ProjectHeader() {
  const { href } = useWorkspaceRoute();
  const { project, openIssue, openCreateIssue } = useProject();
  const { canWrite } = usePermissions();
  const team = useTeam();
  const { issues } = useTracker();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [notFound, setNotFound] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const base = href(`/projects/${project.key}`);

  // ⌘K / Ctrl+K focuses "jump to issue" from anywhere in the project.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function jump() {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const own = issues.filter((i) => i.projectId === project.id);
    const match =
      own.find((i) => i.id.toLowerCase() === q) ??
      own.find((i) => i.id.toLowerCase() === `${project.key.toLowerCase()}-${q}`) ??
      own.find((i) => i.title.toLowerCase().includes(q));
    setNotFound(!match);
    if (match) {
      openIssue(match.id);
      setQuery("");
      searchRef.current?.blur();
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br font-mono text-[11px] font-bold text-white", project.color)}>
          {project.key[0]}
        </span>
        <h1 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-100">
          <span className="truncate">{project.name}</span>
          <span className="rounded border border-line-strong bg-raised px-1 font-mono text-[10px] font-medium text-zinc-400">
            {project.key}
          </span>
        </h1>

        <div className="ml-auto flex items-center gap-3">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              jump();
            }}
            className="relative hidden md:block"
          >
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-500" />
            <label htmlFor="jump-to-issue" className="sr-only">
              Jump to issue
            </label>
            <input
              ref={searchRef}
              id="jump-to-issue"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNotFound(false);
              }}
              placeholder={`Jump to ${project.key}-…`}
              aria-invalid={notFound || undefined}
              className={cn(
                "h-8 w-52 rounded-lg border border-line bg-surface pr-12 pl-8 text-[13px] text-zinc-100 outline-none transition-[border-color,box-shadow,width] placeholder:text-zinc-500 hover:border-line-strong focus:w-64 focus:border-brand/50 focus:ring-2 focus:ring-brand/20 lg:w-60",
                notFound && "border-red-500/50 focus:border-red-500/60 focus:ring-red-500/20",
              )}
            />
            <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded border border-line-strong bg-raised px-1.5 py-px font-sans text-[10px] font-medium text-zinc-400">
              ⌘K
            </kbd>
          </form>

          <div role="group" aria-label="Team" className="hidden gap-1.5 xl:flex">
            {team.members.slice(0, 4).map((m) => (
              <Avatar key={m.id} member={m} size="sm" showPresence={team.showsPresence} />
            ))}
          </div>

          {canWrite && (
            <button
              type="button"
              onClick={() => openCreateIssue()}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-brand px-3 text-[13px] font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_6px_16px_-6px_rgba(124,108,255,0.7)] outline-none transition-all hover:bg-brand-hover active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              <Plus aria-hidden className="size-4" strokeWidth={2.5} />
              <span className="hidden sm:inline">Create Issue</span>
              <span className="sr-only sm:hidden">Create Issue</span>
            </button>
          )}
        </div>
      </div>

      <nav aria-label="Project views" className="scroll-thin flex h-10 items-stretch gap-1 overflow-x-auto px-2 sm:px-4">
        {TABS.map(({ segment, label, icon: Icon }) => {
          const href = `${base}/${segment}`;
          const active = pathname === href;
          return (
            <Link
              key={segment}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:text-zinc-100",
                "after:absolute after:inset-x-2.5 after:bottom-[-1px] after:h-px after:rounded-full",
                active ? "text-zinc-50 after:bg-brand" : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              <Icon aria-hidden className={cn("size-3.5", active ? "text-brand-hover" : "text-zinc-600")} />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
