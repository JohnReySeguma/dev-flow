"use client";

import { io, type Socket } from "socket.io-client";
import { useSyncExternalStore } from "react";
import { refreshSession } from "@/lib/api/client";
import { API_URL } from "@/lib/api/config";
import type { ApiIssue } from "@/lib/api/types";
import { applyLiveEvent, getCurrentUserId, getLiveTarget, refetchProjects, type LiveEvent } from "@/lib/tracker/store";

/*
 * Live Sync (the API's INTEGRATION §7): one Socket.IO connection to the `/realtime` namespace, at
 * `<API_URL>/socket.io` so the handshake carries the `/api/v2`-scoped session cookie. It joins every project of the
 * open workspace, applies teammates' changes to the store (your own already came back over HTTP, so they are
 * skipped), tracks who is online per project, and re-fetches after a reconnect because missed events are not
 * replayed.
 */

export type LiveStatus = "off" | "connecting" | "live" | "offline";

/** A change GitHub made (actorId null), to show as "via GitHub". */
export type GitHubChange = { id: number; projectKey: string; issue: ApiIssue };

type Payload = { workspaceId: string; projectKey: string; actorId: string | null } & Record<string, unknown>;

const ISSUE_AND_SPRINT_EVENTS = [
  "issue.created",
  "issue.updated",
  "issue.moved",
  "issue.deleted",
  "sprint.created",
  "sprint.updated",
  "sprint.started",
  "sprint.completed",
  "sprint.deleted",
  "workflow.updated",
  "project.updated",
  "project.deleted",
] as const;

let status: LiveStatus = "off";
/** Online user ids per project key, in the current workspace. */
let presence: Record<string, string[]> = {};
let githubChange: GitHubChange | null = null;
let githubCount = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

function setStatus(next: LiveStatus) {
  if (status === next) return;
  status = next;
  emit();
}

export const useLiveStatus = () => useSyncExternalStore(subscribe, () => status, () => "off" as LiveStatus);

const NOBODY: string[] = [];
/** User ids with the project open right now (you included once joined). */
export const useOnline = (projectKey: string) => useSyncExternalStore(subscribe, () => presence[projectKey] ?? NOBODY, () => NOBODY);

export const useGitHubChange = () => useSyncExternalStore(subscribe, () => githubChange, () => null);
export function dismissGitHubChange() {
  githubChange = null;
  emit();
}

/** `http://localhost:4000/api/v2` → origin `http://localhost:4000`, path `/api/v2/socket.io`. */
function endpoint() {
  const url = new URL(API_URL!);
  return { origin: url.origin, path: `${url.pathname.replace(/\/+$/, "")}/socket.io` };
}

type Handlers = {
  /** You lost access to the workspace (removed, left elsewhere, or it was deleted). */
  onMembershipEnded: () => void;
};

/**
 * Connects for the workspace the store holds and keeps it in sync until the returned function is called (on
 * leaving or switching the workspace, or signing out).
 */
export function startLiveSync(slug: string, { onMembershipEnded }: Handlers): () => void {
  const { origin, path } = endpoint();
  const socket: Socket = io(`${origin}/realtime`, { path, withCredentials: true, transports: ["websocket", "polling"] });
  let connectedBefore = false;
  let joined = new Set<string>();
  let retry: number | undefined;
  setStatus("connecting");

  const join = (projectKey: string) =>
    socket.emit("project:join", { workspace: slug, projectKey }, (res: { ok: boolean }) => {
      if (res?.ok) joined.add(projectKey);
    });

  socket.on("connect", () => {
    setStatus("live");
    joined = new Set();
    const target = getLiveTarget();
    if (!target || target.slug !== slug) return;
    target.projectKeys.forEach(join);
    // Rooms are not remembered and missed events are not replayed: catch up from the snapshots.
    if (connectedBefore) refetchProjects(target.projectKeys);
    connectedBefore = true;
  });

  socket.on("disconnect", () => {
    setStatus("offline");
    presence = {};
    emit();
  });

  socket.on("connect_error", (err: Error & { data?: { code?: string } }) => {
    setStatus("offline");
    const code = err.data?.code;
    if (code === "UNAUTHENTICATED") return; // signed out: the session store sends the user to /login
    // Refused by the server's middleware: socket.io doesn't retry those on its own.
    if (code === "TOKEN_EXPIRED") {
      void refreshSession()
        .then(() => socket.connect())
        .catch(() => {});
    } else if (code) {
      retry = window.setTimeout(() => socket.connect(), 5000);
    }
  });

  for (const type of ISSUE_AND_SPRINT_EVENTS) {
    socket.on(type, (payload: Payload) => {
      if (payload.actorId !== null && payload.actorId === getCurrentUserId()) return; // ours: already applied
      applyLiveEvent(payload.workspaceId, payload.projectKey, { type, ...payload } as LiveEvent);
      if (payload.actorId === null && (type === "issue.updated" || type === "issue.moved")) {
        githubChange = { id: ++githubCount, projectKey: payload.projectKey, issue: payload.issue as ApiIssue };
        emit();
      }
    });
  }

  socket.on("presence.updated", (payload: Payload & { online: string[] }) => {
    if (getLiveTarget()?.workspaceId !== payload.workspaceId) return;
    presence = { ...presence, [payload.projectKey]: payload.online };
    emit();
  });

  socket.on("membership.ended", (payload: { workspaceId: string }) => {
    if (getLiveTarget()?.workspaceId === payload.workspaceId) onMembershipEnded();
  });

  /** New projects (created here or after a re-fetch) get their room too. */
  const watch = window.setInterval(() => {
    const target = getLiveTarget();
    if (!socket.connected || !target || target.slug !== slug) return;
    target.projectKeys.filter((key) => !joined.has(key)).forEach(join);
  }, 3000);

  return () => {
    window.clearInterval(watch);
    window.clearTimeout(retry);
    socket.removeAllListeners();
    socket.disconnect();
    presence = {};
    setStatus("off");
  };
}
