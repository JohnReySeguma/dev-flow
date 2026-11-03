"use client";

import { useMemo } from "react";
import { isApiMode } from "@/lib/api/config";
import { useSession } from "@/lib/api/session";
import { CURRENT_USER_ID, MEMBERS, MEMBERS_BY_ID, type Member } from "@/lib/members";
import { useWorkspaceMembers } from "./store";

export type Team = {
  /** People who can be assigned: the sample team, or the workspace's active members. */
  members: Member[];
  byId: Record<string, Member>;
  /** You, for "My issues", quick add and the default assignee. */
  currentUserId: string;
  /** Presence is sample data in demo mode; the API reports it through Live Sync (a later step). */
  showsPresence: boolean;
};

const DEMO_TEAM: Team = { members: MEMBERS, byId: MEMBERS_BY_ID, currentUserId: CURRENT_USER_ID, showsPresence: true };

export function useTeam(): Team {
  const members = useWorkspaceMembers();
  const session = useSession();
  const currentUserId = session.status === "signed-in" ? session.user.id : "";
  return useMemo(
    () =>
      isApiMode()
        ? { members, byId: Object.fromEntries(members.map((m) => [m.id, m])), currentUserId, showsPresence: false }
        : DEMO_TEAM,
    [members, currentUserId],
  );
}
