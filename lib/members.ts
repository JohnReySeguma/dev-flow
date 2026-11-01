export type Presence = "online" | "away" | "offline";

export type Member = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  /** Tailwind gradient classes used for the initials avatar. */
  gradient: string;
  presence: Presence;
};

export const CURRENT_USER_ID = "u-jr";

export const MEMBERS: Member[] = [
  { id: "u-jr", name: "John Rey", handle: "jrey", initials: "JR", gradient: "from-violet-500 to-indigo-600", presence: "online" },
  { id: "u-am", name: "Aiko Mori", handle: "aiko", initials: "AM", gradient: "from-rose-500 to-orange-500", presence: "online" },
  { id: "u-dk", name: "Dmitri Kovac", handle: "dkovac", initials: "DK", gradient: "from-sky-500 to-cyan-500", presence: "away" },
  { id: "u-ps", name: "Priya Shah", handle: "priya", initials: "PS", gradient: "from-emerald-500 to-teal-600", presence: "online" },
  { id: "u-lb", name: "Lucas Brandt", handle: "lbrandt", initials: "LB", gradient: "from-amber-500 to-yellow-600", presence: "offline" },
];

export const MEMBERS_BY_ID: Record<string, Member> = Object.fromEntries(MEMBERS.map((m) => [m.id, m]));
