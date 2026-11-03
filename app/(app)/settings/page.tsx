import { WorkspaceRedirect } from "@/components/workspace/workspace-redirect";

/** /settings (old links): open the settings of the right workspace. */
// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function SettingsRedirectPage() {
  return <WorkspaceRedirect />;
}
