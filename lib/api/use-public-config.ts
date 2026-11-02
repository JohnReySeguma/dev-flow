"use client";

import { useSyncExternalStore } from "react";
import { apiFetch } from "./client";
import { isApiMode } from "./config";
import type { PublicConfig } from "./types";

export type PublicConfigState =
  | { status: "loading" }
  | { status: "ready"; config: PublicConfig }
  /** API mode, but `GET /config` failed (server down or unreachable). */
  | { status: "unavailable" };

/** Demo mode keeps v1.0.0's behaviour: both (simulated) sign-in providers are shown. */
const DEMO: PublicConfigState = {
  status: "ready",
  config: { oauth: { github: true, google: true }, githubIntegration: false, email: false },
};
const LOADING: PublicConfigState = { status: "loading" };

let state: PublicConfigState = isApiMode() ? LOADING : DEMO;
let inFlight = false;
const listeners = new Set<() => void>();

function publish(next: PublicConfigState) {
  state = next;
  listeners.forEach((listener) => listener());
}

/** Fetches once per page load; after a failure the next subscriber tries again. */
function load() {
  if (inFlight || state.status === "ready") return;
  inFlight = true;
  apiFetch<PublicConfig>("/config")
    .then((config) => publish({ status: "ready", config }))
    .catch(() => publish({ status: "unavailable" }))
    .finally(() => {
      inFlight = false;
    });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (isApiMode()) load();
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => (isApiMode() ? LOADING : DEMO);

/**
 * The server's feature flags (`GET /config`). In demo mode it answers immediately with v1.0.0's behaviour;
 * in API mode it starts as `loading`, so nothing is shown that might disappear once the answer arrives.
 */
export function usePublicConfig(): PublicConfigState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
