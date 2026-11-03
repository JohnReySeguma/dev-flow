"use client";

import { reloadSession } from "@/lib/api/session";
import { chooseWorkspace, workspacePath } from "@/lib/workspace-route";

type Router = { replace: (href: string) => void };

/**
 * The workspace `slug` is gone for this user (left, deleted, removed, or it answered 404): refresh /auth/me and
 * open another workspace (the last used, else the first), or /welcome when none is left. If the refreshed list
 * does contain `slug` after all (e.g. just joined), stay and return true.
 */
export async function leaveForAnotherWorkspace(router: Router, slug: string, { force = false } = {}): Promise<boolean> {
  const session = await reloadSession();
  const slugs = session.status === "signed-in" ? session.workspaces.map((w) => w.slug) : [];
  if (!force && slugs.includes(slug)) return true;
  const next = chooseWorkspace(slugs.filter((s) => s !== slug));
  router.replace(next ? workspacePath(next) : "/welcome");
  return false;
}
