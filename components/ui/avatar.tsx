import type { Member, Presence } from "@/lib/members";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-7 text-[11px]",
  lg: "size-9 text-[13px]",
  xl: "size-16 text-xl",
} as const;

const PRESENCE_RING: Record<Presence, string> = {
  online: "ring-emerald-500/90",
  away: "ring-amber-400/90",
  offline: "ring-zinc-700",
};

const PRESENCE_LABEL: Record<Presence, string> = {
  online: "Online",
  away: "Away",
  offline: "Offline",
};

type AvatarProps = {
  member: Member;
  size?: keyof typeof SIZES;
  /** Draws a presence-colored ring offset from the canvas. */
  showPresence?: boolean;
  className?: string;
};

export function Avatar({
  member,
  size = "sm",
  showPresence = false,
  className,
}: AvatarProps) {
  const title = showPresence
    ? `${member.name} · ${PRESENCE_LABEL[member.presence]}`
    : member.name;

  return (
    <span
      title={title}
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold tracking-tight text-white",
        member.gradient,
        SIZES[size],
        showPresence &&
          cn("ring-2 ring-offset-2 ring-offset-canvas", PRESENCE_RING[member.presence]),
        className,
      )}
    >
      {member.initials}
      <span className="sr-only">{title}</span>
    </span>
  );
}

export function UnassignedAvatar({
  size = "sm",
}: {
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      title="Unassigned"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-zinc-600 text-zinc-500",
        SIZES[size],
      )}
    >
      <span className="sr-only">Unassigned</span>
    </span>
  );
}
