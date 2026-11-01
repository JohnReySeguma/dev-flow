import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-indigo-600 shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_4px_12px_-2px_rgba(124,108,255,0.5)]",
        className,
      )}
    >
      <svg viewBox="0 0 16 16" aria-hidden className="size-4 text-white">
        <path d="M3 4h4.5a4 4 0 0 1 0 8H3z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.5 8H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight text-zinc-50">DevFlow</span>
    </span>
  );
}
