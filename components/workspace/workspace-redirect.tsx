"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { isApiMode } from "@/lib/api/config";
import { useSession, type SessionState } from "@/lib/api/session";
import { chooseWorkspace, DEMO_WORKSPACE_SLUG } from "@/lib/workspace-route";

/** The slug a workspace-less URL should open; `null` when the account has none (→ /welcome). */
function targetWorkspace(session: SessionState): string | null {
  if (!isApiMode()) return DEMO_WORKSPACE_SLUG;
  if (session.status !== "signed-in") return null;
  // The remembered workspace only counts if /auth/me still lists it.
  return chooseWorkspace(session.workspaces.map((w) => w.slug));
}

/**
 * Old and workspace-less paths (/projects, /projects/DEV/board, /settings): open the same page in the right
 * workspace. Keeps bookmarks, emailed links and the OAuth landing page (/projects) working.
 */
export function WorkspaceRedirect() {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (isApiMode() && session.status !== "signed-in") return;
    const slug = targetWorkspace(session);
    router.replace(slug ? `/w/${encodeURIComponent(slug)}${pathname}${window.location.search}` : "/welcome");
  }, [pathname, router, session]);

  return (
    <div role="status" aria-busy="true" className="flex flex-1 items-center justify-center text-[13px] text-zinc-500">
      Opening your workspace…
    </div>
  );
}
