"use client";

import { createContext, useContext } from "react";
import { workspacePath } from "@/lib/workspace-route";

export type WorkspaceRoute = {
  slug: string;
  /** A path inside this workspace, e.g. href("/projects/DEV/board") → "/w/acme-inc/projects/DEV/board". */
  href: (path: string) => string;
};

export const WorkspaceContext = createContext<WorkspaceRoute | null>(null);

export function makeWorkspaceRoute(slug: string): WorkspaceRoute {
  return { slug, href: (path) => workspacePath(slug, path) };
}

/** The workspace of the current /w/{slug} route. Only valid below the workspace layout. */
export function useWorkspaceRoute(): WorkspaceRoute {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspaceRoute must be used inside a /w/[slug] route");
  return value;
}
