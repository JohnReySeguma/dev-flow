import { WorkspaceRedirect } from "@/components/workspace/workspace-redirect";

/** /projects (the OAuth landing page, old links): open the projects of the right workspace. */
// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ProjectsRedirectPage() {
  return <WorkspaceRedirect />;
}
