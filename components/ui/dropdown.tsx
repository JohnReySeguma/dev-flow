"use client";

import { Check } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type DropdownProps = {
  /** Contents of the trigger button. */
  trigger: ReactNode;
  triggerLabel: string;
  triggerClassName?: string;
  align?: "start" | "end";
  menuClassName?: string;
  children: (close: () => void) => ReactNode;
};

/**
 * Lightweight popover menu: toggles on click, closes on outside pointer-down
 * and Escape, and returns focus to its trigger when dismissed via keyboard.
 */
export function Dropdown({
  trigger,
  triggerLabel,
  triggerClassName,
  align = "start",
  menuClassName,
  children,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close when the route is hidden by Activity, so menus never reappear open.
  useLayoutEffect(() => {
    return () => setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn(triggerClassName, open && "border-line-strong bg-raised text-zinc-100")}
      >
        {trigger}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "animate-pop-in absolute top-full z-50 mt-1.5 min-w-52 rounded-lg border border-line-strong bg-elevated/95 p-1 shadow-2xl shadow-black/60 backdrop-blur-md",
            align === "end" ? "right-0" : "left-0",
            menuClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pt-1.5 pb-1 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div role="separator" className="-mx-1 my-1 h-px bg-line" />;
}

type MenuItemProps = {
  children: ReactNode;
  icon?: ReactNode;
  checked?: boolean;
  hint?: ReactNode;
  destructive?: boolean;
  onSelect: () => void;
};

export function MenuItem({
  children,
  icon,
  checked,
  hint,
  destructive,
  onSelect,
}: MenuItemProps) {
  const isCheckable = checked !== undefined;
  return (
    <button
      type="button"
      role={isCheckable ? "menuitemcheckbox" : "menuitem"}
      aria-checked={isCheckable ? checked : undefined}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-zinc-300 outline-none transition-colors",
        "hover:bg-raised hover:text-zinc-50 focus-visible:bg-raised focus-visible:text-zinc-50",
        destructive && "text-red-400 hover:text-red-300 focus-visible:text-red-300",
      )}
    >
      {icon && <span className="flex size-4 items-center justify-center text-zinc-400">{icon}</span>}
      <span className="flex-1 truncate">{children}</span>
      {hint && <span className="text-[11px] text-zinc-500">{hint}</span>}
      {isCheckable && (
        <Check
          aria-hidden
          className={cn("size-3.5 text-brand transition-opacity", checked ? "opacity-100" : "opacity-0")}
        />
      )}
    </button>
  );
}
