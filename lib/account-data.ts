import { CURRENT_USER_ID, MEMBERS_BY_ID, type Member } from "./members";

export type Role = "admin" | "member" | "viewer";

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: "admin", label: "Admin", description: "Manage members, billing and all projects" },
  { id: "member", label: "Member", description: "Create and edit issues in any project" },
  { id: "viewer", label: "Viewer", description: "Read-only access to boards and issues" },
];

export type UserProfile = Member & {
  email: string;
  role: Role;
  timezone: string;
  bio: string;
};

export const SESSION_USER: UserProfile = {
  ...MEMBERS_BY_ID[CURRENT_USER_ID],
  email: "jrey@acme.dev",
  role: "admin",
  timezone: "America/New_York",
  bio: "Frontend platform lead. Owns the board, realtime sync and the design system.",
};

export const TIMEZONES = [
  "Pacific/Honolulu",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Helsinki",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Manila",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
] as const;

/** Gradient choices for initials avatars (profile avatar picker). */
export const AVATAR_GRADIENTS = [
  { value: "from-violet-500 to-indigo-600", label: "Violet" },
  { value: "from-rose-500 to-orange-500", label: "Sunset" },
  { value: "from-sky-500 to-cyan-500", label: "Sky" },
  { value: "from-emerald-500 to-teal-600", label: "Emerald" },
  { value: "from-amber-500 to-yellow-600", label: "Amber" },
  { value: "from-fuchsia-500 to-pink-600", label: "Fuchsia" },
] as const;

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  initials: string;
  gradient: string;
  role: Role;
  status: "active" | "invited";
  /** Null for pending invites. */
  lastActiveAt: string | null;
};

export const TEAM: TeamMember[] = [
  {
    id: "u-jr",
    name: "John Rey",
    email: "jrey@acme.dev",
    initials: "JR",
    gradient: "from-violet-500 to-indigo-600",
    role: "admin",
    status: "active",
    lastActiveAt: "2026-11-01T08:55:00Z",
  },
  {
    id: "u-am",
    name: "Aiko Mori",
    email: "aiko@acme.dev",
    initials: "AM",
    gradient: "from-rose-500 to-orange-500",
    role: "admin",
    status: "active",
    lastActiveAt: "2026-11-01T08:12:00Z",
  },
  {
    id: "u-dk",
    name: "Dmitri Kovac",
    email: "dmitri@acme.dev",
    initials: "DK",
    gradient: "from-sky-500 to-cyan-500",
    role: "member",
    status: "active",
    lastActiveAt: "2026-10-31T22:40:00Z",
  },
  {
    id: "u-ps",
    name: "Priya Shah",
    email: "priya@acme.dev",
    initials: "PS",
    gradient: "from-emerald-500 to-teal-600",
    role: "member",
    status: "active",
    lastActiveAt: "2026-11-01T07:30:00Z",
  },
  {
    id: "u-lb",
    name: "Lucas Brandt",
    email: "lucas@acme.dev",
    initials: "LB",
    gradient: "from-amber-500 to-yellow-600",
    role: "viewer",
    status: "active",
    lastActiveAt: "2026-10-27T16:05:00Z",
  },
];

export type TokenScope = "issues:read" | "issues:write" | "projects:admin" | "webhooks:manage";

export const TOKEN_SCOPES: { id: TokenScope; description: string }[] = [
  { id: "issues:read", description: "Read issues, comments and boards" },
  { id: "issues:write", description: "Create, update and move issues" },
  { id: "projects:admin", description: "Manage project settings and cycles" },
  { id: "webhooks:manage", description: "Register and rotate GitHub webhooks" },
];

export type AccessToken = {
  id: string;
  name: string;
  /** Last four characters; the full secret is only shown once at creation. */
  lastFour: string;
  scopes: TokenScope[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
};

export const ACCESS_TOKENS: AccessToken[] = [
  {
    id: "pat_01",
    name: "devflow-cli · MacBook Pro",
    lastFour: "q7Rk",
    scopes: ["issues:read", "issues:write"],
    createdAt: "2026-08-14T10:00:00Z",
    lastUsedAt: "2026-11-01T08:41:00Z",
    expiresAt: null,
  },
  {
    id: "pat_02",
    name: "GitHub Actions · release.yml",
    lastFour: "Zx02",
    scopes: ["issues:write", "webhooks:manage"],
    createdAt: "2026-06-02T09:30:00Z",
    lastUsedAt: "2026-10-30T18:12:00Z",
    expiresAt: "2026-12-01T00:00:00Z",
  },
];
