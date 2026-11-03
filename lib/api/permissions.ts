"use client";

import { useContext } from "react";
import { WorkspaceContext } from "@/components/workspace/workspace-context";
import { useSession } from "./session";
import type { Role, WorkspaceSummary } from "./types";

export type Permissions = {
  /** Your role in the workspace in the URL. */
  role: Role;
  /** Create and edit issues, comments and sprints; create and rename projects (member, admin). */
  canWrite: boolean;
  /** Manage members and invites, edit workflows, delete projects, reset sample data (admin). */
  canAdmin: boolean;
  /** The current workspace is the shared demo one: rename, delete, leave, invites and member changes are locked. */
  isDemoWorkspace: boolean;
  /** The signed-in account is a shared demo account: its profile and tokens are read-only. */
  isDemoAccount: boolean;
};

/** The workspace in the URL, from the signed-in account's list; `null` outside a workspace or in demo mode. */
export function useCurrentWorkspace(): WorkspaceSummary | null {
  const session = useSession();
  const route = useContext(WorkspaceContext);
  if (session.status !== "signed-in" || !route) return null;
  return session.workspaces.find((w) => w.slug === route.slug) ?? null;
}

/**
 * What you may do in the current workspace (the API's INTEGRATION §5.9), for hiding controls that would answer 403.
 * Roles are per workspace since API v2. The API enforces it regardless. Demo mode has every permission, as before.
 */
export function usePermissions(): Permissions {
  const session = useSession();
  const workspace = useCurrentWorkspace();
  if (session.status !== "signed-in") {
    return { role: "admin", canWrite: true, canAdmin: true, isDemoWorkspace: false, isDemoAccount: false };
  }
  const role: Role = workspace?.role ?? "viewer";
  return {
    role,
    canWrite: role !== "viewer",
    canAdmin: role === "admin",
    isDemoWorkspace: workspace?.isDemo ?? false,
    isDemoAccount: session.user.isDemo,
  };
}
