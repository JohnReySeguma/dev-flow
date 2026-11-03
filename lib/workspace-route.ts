/*
 * Workspace URLs. Everything inside a workspace lives under /w/{slug}/…; the account (/profile) and the token pages
 * (/login, /invite, …) stay global. The API has no "current workspace", so the slug in the URL is the source of
 * truth, and the last one used is remembered in this browser for redirects such as the OAuth landing page.
 */

/** The single local workspace of demo mode (and the seeded demo workspace of the API). */
export const DEMO_WORKSPACE_SLUG = "acme-inc";

/** `/w/{slug}{path}`, e.g. workspacePath("acme-inc", "/projects/DEV/board"). */
export function workspacePath(slug: string, path = "/projects") {
  return `/w/${encodeURIComponent(slug)}${path.startsWith("/") ? path : `/${path}`}`;
}

const LAST_KEY = "devflow:last-workspace";

export function readLastWorkspace(): string | null {
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}

/**
 * Which workspace a workspace-less URL should open: the last one used if it is still in the list, otherwise the
 * first. `null` when there are none (show /welcome).
 */
export function chooseWorkspace(slugs: string[]): string | null {
  const last = readLastWorkspace();
  if (last && slugs.includes(last)) return last;
  return slugs[0] ?? null;
}

export function rememberWorkspace(slug: string) {
  try {
    window.localStorage.setItem(LAST_KEY, slug);
  } catch {
    // Storage blocked: redirects fall back to the first workspace.
  }
}
