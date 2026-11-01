"use client";

import { useSyncExternalStore } from "react";

/** The instant the server renders against, so SSR output is deterministic. */
const SERVER_NOW = Date.parse("2026-11-01T09:00:00Z");

let current = 0;
const listeners = new Set<() => void>();
let timer: number | undefined;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    timer = window.setInterval(() => {
      current = Date.now();
      listeners.forEach((l) => l());
    }, 60_000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.clearInterval(timer);
  };
}

function getSnapshot() {
  current ||= Date.now();
  return current;
}

/**
 * Current time for relative labels ("2d ago"), ticking once a minute.
 * Hydrates with the server's fixed instant, then switches to the real clock.
 */
export function useNow() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_NOW);
}
