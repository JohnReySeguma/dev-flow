"use client";

import { FolderKanban, LogOut, Menu, Settings, UserRound, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Logo } from "@/components/ui/logo";
import { SESSION_USER } from "@/lib/account-data";
import { isApiMode } from "@/lib/api/config";
import { signOut, useSession } from "@/lib/api/session";
import type { Member } from "@/lib/members";
import { useTracker } from "@/lib/tracker/store";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const ACCOUNT_ITEMS: NavItem[] = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Workspace settings", icon: Settings },
];

/**
 * Navigation for signed-in routes: a fixed rail on large screens and a
 * slide-over drawer (opened from a compact top bar) below `lg`.
 */
export function AppSidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    return () => setDrawerOpen(false);
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface/40 lg:flex">
        <SidebarContent />
      </aside>

      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line bg-canvas px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation"
          aria-expanded={drawerOpen}
          className="rounded-md p-1.5 text-zinc-400 outline-none hover:bg-elevated hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Menu className="size-4" />
        </button>
        <Link href="/projects" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          <Logo />
        </Link>
      </div>

      <div
        aria-hidden={!drawerOpen}
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        inert={!drawerOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-surface shadow-2xl transition-transform duration-200 ease-out lg:hidden",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setDrawerOpen(false)}
          aria-label="Close navigation"
          className="absolute top-3.5 right-3 rounded-md p-1.5 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <X className="size-4" />
        </button>
        <SidebarContent onNavigate={() => setDrawerOpen(false)} />
      </div>
    </>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // The app shell stays mounted (hidden) after logout; re-enable the button.
  useLayoutEffect(() => {
    return () => setSigningOut(false);
  }, []);

  const session = useSession();
  // API mode shows the signed-in account (you are online by definition); demo mode the fixture user.
  const user: Member & { email: string } =
    session.status === "signed-in" ? { ...session.user, presence: "online" } : SESSION_USER;

  function logout() {
    setSigningOut(true);
    // API mode: revoke the session; the session gate then sends the browser to /login.
    if (isApiMode()) void signOut();
    // Demo mode: no real session, so simulate the round trip, then leave the app.
    else window.setTimeout(() => router.push("/login"), 450);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 items-center px-4">
        <Link href="/projects" onClick={onNavigate} className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          <Logo />
        </Link>
      </div>

      <div className="mx-3 flex items-center gap-2.5 rounded-lg border border-line bg-elevated px-2.5 py-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-raised text-[10px] font-semibold text-zinc-300 ring-1 ring-line-strong">
          A
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] leading-tight text-zinc-500">Workspace</span>
          <span className="block truncate text-[13px] leading-tight font-medium text-zinc-100">Acme Inc</span>
        </span>
      </div>

      {/* Reading the pathname suspends on routes with runtime params (new projects). */}
      <Suspense fallback={<SidebarNav pathname={null} onNavigate={onNavigate} />}>
        <ActiveSidebarNav onNavigate={onNavigate} />
      </Suspense>

      <div className="flex items-center gap-2.5 border-t border-line px-4.5 py-3">
        <Avatar member={user} size="md" showPresence />
        <div className="min-w-0 flex-1 pl-0.5">
          <p className="truncate text-[13px] font-medium text-zinc-100">{user.name}</p>
          <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={signingOut}
          aria-label="Log out"
          title="Log out"
          className="rounded-md p-1.5 text-zinc-500 outline-none transition-colors hover:bg-raised hover:text-red-300 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50"
        >
          <LogOut className={cn("size-4", signingOut && "animate-pulse")} />
        </button>
      </div>
    </div>
  );
}

function ActiveSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return <SidebarNav pathname={usePathname()} onNavigate={onNavigate} />;
}

function SidebarNav({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  const { projects } = useTracker();
  const isActive = (href: string, exact = false) =>
    pathname !== null && (exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));

  const linkClass = (active: boolean) =>
    cn(
      "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
      active ? "bg-raised text-zinc-50 shadow-[inset_0_0_0_1px_var(--color-line-strong)]" : "text-zinc-400 hover:bg-elevated hover:text-zinc-100",
    );
  const marker = <span aria-hidden className="absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-r-full bg-brand" />;

  return (
    <nav aria-label="Main" className="scroll-thin mt-5 flex-1 overflow-y-auto px-3">
      <div className="mb-5">
        <Link href="/projects" onClick={onNavigate} aria-current={isActive("/projects", true) ? "page" : undefined} className={linkClass(isActive("/projects", true))}>
          {isActive("/projects", true) && marker}
          <FolderKanban aria-hidden className={cn("size-4", isActive("/projects", true) ? "text-brand-hover" : "text-zinc-500 group-hover:text-zinc-300")} />
          All projects
        </Link>
      </div>

      <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-zinc-600 uppercase">Your projects</p>
      <ul className="mb-5 flex flex-col gap-0.5">
        {projects.map((project) => {
          const base = `/projects/${project.key}`;
          const active = isActive(base);
          return (
            <li key={project.id}>
              <Link href={`${base}/board`} onClick={onNavigate} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                {active && marker}
                <span className={cn("flex size-4 shrink-0 items-center justify-center rounded bg-gradient-to-br font-mono text-[8px] font-bold text-white", project.color)}>
                  {project.key[0]}
                </span>
                <span className="truncate">{project.name}</span>
                <span className="ml-auto font-mono text-[10px] text-zinc-600">{project.key}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-zinc-600 uppercase">Account</p>
      <ul className="flex flex-col gap-0.5">
        {ACCOUNT_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link href={href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                {active && marker}
                <Icon aria-hidden className={cn("size-4", active ? "text-brand-hover" : "text-zinc-500 group-hover:text-zinc-300")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
