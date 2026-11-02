"use client";

import { useSession } from "./session";
import type { Role } from "./types";

export type Permissions = {
  role: Role;
  /** Create and edit issues, comments and sprints; create and rename projects (member, admin). */
  canWrite: boolean;
  /** Manage members and invites, edit workflows, delete projects, reset demo data (admin). */
  canAdmin: boolean;
};

/**
 * What the signed-in role may do (the API's INTEGRATION §5.9), for hiding controls that would answer 403.
 * The API enforces it regardless. Demo mode has every permission, as before. Signed-in routes only render once
 * the session gate has a session, so other states don't occur there.
 */
export function usePermissions(): Permissions {
  const session = useSession();
  const role: Role = session.status === "signed-in" ? session.user.role : "admin";
  return { role, canWrite: role !== "viewer", canAdmin: role === "admin" };
}
