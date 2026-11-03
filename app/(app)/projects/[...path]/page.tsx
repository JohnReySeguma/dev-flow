import { Suspense } from "react";
import { WorkspaceRedirect } from "@/components/workspace/workspace-redirect";

/** Old project links (/projects/DEV/board, …): open the same page in the right workspace. */
// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ProjectPathRedirectPage() {
  return (
    <Suspense>
      <WorkspaceRedirect />
    </Suspense>
  );
}
