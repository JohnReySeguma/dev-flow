"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, type ReactNode } from "react";
import { isApiMode } from "@/lib/api/config";
import { useSession } from "@/lib/api/session";
import { DEMO_WORKSPACE_SLUG, rememberWorkspace, workspacePath } from "@/lib/workspace-route";
import { TrackerGate } from "./tracker-gate";
import { makeWorkspaceRoute, WorkspaceContext } from "./workspace-context";
import { leaveForAnotherWorkspace } from "./workspace-navigation";

type WorkspaceShellProps = {
  params: Promise<{ slug: string }>;
  children: ReactNode;
};

/**
 * Resolves the workspace from the URL, remembers it, and provides it to everything below. In API mode the slug
 * must be one of the account's workspaces (from /auth/me); otherwise the user is moved to another one. Its tracker
 * data loads before the pages render (TrackerGate).
 */
export function WorkspaceShell({ params, children }: WorkspaceShellProps) {
  const { slug } = use(params);
  const router = useRouter();
  const session = useSession();
  const checked = useRef<string | null>(null);

  // Demo mode has exactly one local workspace; API mode accepts the account's workspaces.
  const known = !isApiMode()
    ? slug === DEMO_WORKSPACE_SLUG
    : session.status === "signed-in" && session.workspaces.some((w) => w.slug === slug);
  const route = useMemo(() => makeWorkspaceRoute(slug), [slug]);

  useEffect(() => {
    if (known) {
      rememberWorkspace(slug);
      return;
    }
    if (!isApiMode()) {
      router.replace(workspacePath(DEMO_WORKSPACE_SLUG));
      return;
    }
    // Not in the list we have: re-read it once (maybe just joined), then move on if it's still not there.
    if (session.status === "signed-in" && checked.current !== slug) {
      checked.current = slug;
      void leaveForAnotherWorkspace(router, slug);
    }
  }, [known, slug, router, session.status]);

  if (!known) return <WorkspaceShellFallback />;
  return (
    <WorkspaceContext value={route}>
      <TrackerGate key={slug} slug={slug} fallback={<WorkspaceShellFallback />}>
        {children}
      </TrackerGate>
    </WorkspaceContext>
  );
}

export function WorkspaceShellFallback() {
  return (
    <div role="status" aria-busy="true" className="flex flex-1 flex-col">
      <span className="sr-only">Opening the workspace…</span>
      <div aria-hidden className="h-14 border-b border-line" />
      <div aria-hidden className="flex flex-1 gap-3 p-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-full max-h-96 flex-1 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
