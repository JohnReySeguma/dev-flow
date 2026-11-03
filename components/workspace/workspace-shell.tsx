"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, type ReactNode } from "react";
import { isApiMode } from "@/lib/api/config";
import { DEMO_WORKSPACE_SLUG, rememberWorkspace, workspacePath } from "@/lib/workspace-route";
import { makeWorkspaceRoute, WorkspaceContext } from "./workspace-context";

type WorkspaceShellProps = {
  params: Promise<{ slug: string }>;
  children: ReactNode;
};

/** Resolves the workspace from the URL, remembers it, and provides it to everything below. */
export function WorkspaceShell({ params, children }: WorkspaceShellProps) {
  const { slug } = use(params);
  const router = useRouter();
  // Demo mode has exactly one local workspace.
  const known = isApiMode() || slug === DEMO_WORKSPACE_SLUG;
  const route = useMemo(() => makeWorkspaceRoute(slug), [slug]);

  useEffect(() => {
    if (known) rememberWorkspace(slug);
    else router.replace(workspacePath(DEMO_WORKSPACE_SLUG));
  }, [known, slug, router]);

  if (!known) return <WorkspaceShellFallback />;
  return <WorkspaceContext value={route}>{children}</WorkspaceContext>;
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
