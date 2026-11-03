import { Suspense } from "react";
import { WorkspaceShell, WorkspaceShellFallback } from "@/components/workspace/workspace-shell";
import { DEMO_WORKSPACE_SLUG } from "@/lib/workspace-route";

/** Prerender the demo workspace; other workspaces render on demand. */
export function generateStaticParams() {
  return [{ slug: DEMO_WORKSPACE_SLUG }];
}

/**
 * Entering a workspace waits for the browser to confirm membership and load its data (WorkspaceShell, TrackerGate),
 * so it can't be instant; navigations between its pages are still validated.
 */
export const instant = false;

export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[slug]">) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <WorkspaceShell params={params}>{children}</WorkspaceShell>
    </Suspense>
  );
}
