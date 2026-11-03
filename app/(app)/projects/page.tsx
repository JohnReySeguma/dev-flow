import { WorkspaceRedirect } from "@/components/workspace/workspace-redirect";

/** /projects (the OAuth landing page, old links): open the projects of the right workspace. */
export default function ProjectsRedirectPage() {
  return <WorkspaceRedirect />;
}
