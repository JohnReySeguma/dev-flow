"use client";

import { useSyncExternalStore } from "react";
import { getSession, login, logout, signup } from "./auth";
import { onSignedOut } from "./client";
import { isApiMode } from "./config";
import type { AuthMe, LoginRequest, SignupRequest, UserProfile } from "./types";

export type SessionState =
  /** No API: the app runs on local demo data with the fixture user. */
  | { status: "demo" }
  | { status: "loading" }
  | { status: "signed-in"; user: UserProfile; workspace: AuthMe["workspace"] }
  | { status: "signed-out" }
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
  return { status: "signed-in", user: me.user, workspace: me.workspace };
}

// Any request (or refresh) that learns the session is gone flips the whole app to signed out.
if (isApiMode()) onSignedOut(() => publish({ status: "signed-out" }));

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

/** Also signed out locally when the request fails: the user asked to leave. */
export async function signOut(): Promise<void> {
  try {
    await logout();
  } finally {
    publish({ status: "signed-out" });
  }
}

/** The API already ended every session (e.g. after a password reset); forget this tab's one too. */
export function forgetSession() {
  if (isApiMode()) publish({ status: "signed-out" });
}

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
