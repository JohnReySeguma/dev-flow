"use client";

import { useSyncExternalStore } from "react";
import { getSession, login, logout, signup } from "./auth";
import { onSignedOut } from "./client";
import { isApiMode } from "./config";
import type { AcceptInviteRequest, AuthMe, LoginRequest, SignupRequest, UserProfile, WorkspaceSummary } from "./types";
import { acceptInvite } from "./workspace";

export type SessionState =
  /** No API: the app runs on local demo data with the fixture user. */
  | { status: "demo" }
  | { status: "loading" }
  /** `workspaces`: every workspace the account belongs to, oldest membership first, with its role in each. */
  | { status: "signed-in"; user: UserProfile; workspaces: WorkspaceSummary[] }
  /** `logout`: the user asked to leave; `expired`: the API reported the session gone (or there never was one). */
  | { status: "signed-out"; reason: "logout" | "expired" }
  /** The session check failed for another reason (API unreachable, rate limited, server error). */
  | { status: "error"; error: unknown };

const DEMO: SessionState = { status: "demo" };
const LOADING: SessionState = { status: "loading" };

let state: SessionState = isApiMode() ? LOADING : DEMO;
let checking: Promise<void> | null = null;
const listeners = new Set<() => void>();

function publish(next: SessionState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function signedIn(me: AuthMe): SessionState {
  return { status: "signed-in", user: me.user, workspaces: me.workspaces };
}

// Any request (or refresh) that learns the session is gone flips the whole app to signed out.
if (isApiMode()) onSignedOut(() => publish({ status: "signed-out", reason: "expired" }));

/** `GET /auth/me`, deduplicated. Safe to call repeatedly, e.g. from a "Try again" button. */
export function checkSession(): Promise<void> {
  if (!isApiMode()) return Promise.resolve();
  checking ??= getSession()
    .then((me) => publish(signedIn(me)))
    .catch((error: unknown) => {
      // UNAUTHENTICATED is already published as signed-out by onSignedOut.
      if (state.status !== "signed-out") publish({ status: "error", error });
    })
    .finally(() => {
      checking = null;
    });
  return checking;
}

export async function signIn(credentials: LoginRequest): Promise<AuthMe> {
  const me = await login(credentials);
  publish(signedIn(me));
  return me;
}

export async function signUp(details: SignupRequest): Promise<AuthMe> {
  const me = await signup(details);
  publish(signedIn(me));
  return me;
}

/** Accepting an invite creates the account and signs it in, like sign-up. */
export async function joinWorkspace(token: string, details: AcceptInviteRequest): Promise<AuthMe> {
  const me = await acceptInvite(token, details);
  publish(signedIn(me));
  return me;
}

/** Also signed out locally when the request fails: the user asked to leave. */
export async function signOut(): Promise<void> {
  try {
    await logout();
  } finally {
    publish({ status: "signed-out", reason: "logout" });
  }
}

/** The API already ended every session (e.g. after a password reset); forget this tab's one too. */
export function forgetSession() {
  if (isApiMode()) publish({ status: "signed-out", reason: "expired" });
}

/**
 * Re-reads `GET /auth/me` while staying signed in, e.g. after creating, leaving or deleting a workspace, or when a
 * workspace answers 404 (removed or deleted). Resolves with the new state.
 */
export async function reloadSession(): Promise<SessionState> {
  if (!isApiMode()) return state;
  try {
    publish(signedIn(await getSession()));
  } catch (error) {
    if (state.status !== "signed-out") publish({ status: "error", error });
  }
  return state;
}

/** The current state outside React (event handlers, redirects). */
export const getSessionState = () => state;

/** Keeps the shell (sidebar, header) in step after the profile is saved. */
export function setSessionUser(user: UserProfile) {
  if (state.status === "signed-in") publish({ ...state, user });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (state.status === "loading") void checkSession();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => (isApiMode() ? LOADING : DEMO);

export function useSession(): SessionState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
