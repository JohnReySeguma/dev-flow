import { Suspense } from "react";
import { WorkspaceRedirect } from "@/components/workspace/workspace-redirect";

/** Old project links (/projects/DEV/board, …): open the same page in the right workspace. */
export default function ProjectPathRedirectPage() {
  return (
    <Suspense>
      <WorkspaceRedirect />
    </Suspense>
  );
}
