"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isApiMode } from "@/lib/api/config";
import { DEMO_WORKSPACE_SLUG, readLastWorkspace, workspacePath } from "@/lib/workspace-route";

/** The slug a workspace-less URL should open. */
function targetWorkspace(): string {
  if (!isApiMode()) return DEMO_WORKSPACE_SLUG;
  return readLastWorkspace() ?? DEMO_WORKSPACE_SLUG;
}

/**
 * Old and workspace-less paths (/projects, /projects/DEV/board, /settings): open the same page in the right
 * workspace. Keeps bookmarks, emailed links and the OAuth landing page (/projects) working.
 */
export function WorkspaceRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    router.replace(`${workspacePath(targetWorkspace(), pathname)}${window.location.search}`);
  }, [pathname, router]);

  return (
    <div role="status" aria-busy="true" className="flex flex-1 items-center justify-center text-[13px] text-zinc-500">
      Opening your workspace…
    </div>
  );
}
