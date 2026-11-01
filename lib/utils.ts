import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Compact relative label, e.g. "just now", "12m ago", "2d ago", "3w ago". */
export function timeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - Date.parse(iso));
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return `${Math.floor(diff / (7 * DAY))}w ago`;
}

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * "Oct 3, 2026". Locale and zone are pinned so server and client output match.
 */
export function formatDate(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export type DueState = "overdue" | "soon" | "later";

/** Describes a due date relative to `now`, rounded to whole days. */
export function dueLabel(
  iso: string,
  now: number,
): { label: string; state: DueState } {
  const days = Math.round((Date.parse(iso) - now) / DAY);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, state: "overdue" };
  if (days === 0) return { label: "Due today", state: "soon" };
  if (days === 1) return { label: "Due tomorrow", state: "soon" };
  return { label: `Due in ${days}d`, state: days <= 3 ? "soon" : "later" };
}
