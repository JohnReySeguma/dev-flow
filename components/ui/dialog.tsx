"use client";

import { X } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** Sticky action bar at the bottom. */
  footer?: ReactNode;
  /** `sheet` slides in from the right edge at full height. */
  variant?: "modal" | "sheet";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const MODAL_SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" } as const;

/**
 * Native <dialog> shown with showModal(): the browser provides the focus trap,
 * Escape handling and an inert page behind it.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  variant = "modal",
  size = "md",
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    // Also runs when the route is hidden by Activity: never leave a modal
    // (and the inert page behind it) open on a hidden route.
    return () => el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "border border-line-strong bg-surface p-0 text-zinc-200 shadow-2xl shadow-black/70 backdrop:bg-black/60 backdrop:backdrop-blur-[2px]",
        variant === "modal"
          ? cn("m-auto w-[calc(100%-2rem)] rounded-xl open:animate-pop-in", MODAL_SIZES[size])
          : "my-0 mr-0 ml-auto h-dvh max-h-dvh w-full max-w-xl rounded-none border-y-0 border-r-0 sm:rounded-l-xl",
      )}
    >
      {open && (
        <div className={cn("flex flex-col", variant === "sheet" ? "h-full" : "max-h-[calc(100dvh-4rem)]")}>
          <header className="flex items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
              {description && <p className="mt-1 text-[13px] text-zinc-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1.5 rounded-md p-1.5 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && (
            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/40 px-5 py-3">
              {footer}
            </footer>
          )}
        </div>
      )}
    </dialog>
  );
}
