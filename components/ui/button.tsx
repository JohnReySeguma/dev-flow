import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:
    "bg-brand text-white shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_6px_16px_-6px_rgba(124,108,255,0.7)] hover:bg-brand-hover",
  secondary:
    "border border-line-strong bg-raised text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white",
  ghost: "text-zinc-400 hover:bg-elevated hover:text-zinc-100",
  danger:
    "border border-red-500/25 bg-red-500/10 text-red-300 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-200",
  white: "bg-zinc-50 text-zinc-950 hover:bg-white shadow-[0_6px_20px_-8px_rgba(255,255,255,0.4)]",
} as const;

const SIZES = {
  sm: "h-7 gap-1.5 rounded-md px-2.5 text-[12px]",
  md: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  lg: "h-10 gap-2 rounded-lg px-4 text-sm",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

/** Class string for button-styled elements, so links can share the look. */
export function buttonStyles({
  variant = "secondary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap outline-none transition-[background-color,border-color,color,transform] select-none active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({
  variant,
  size,
  loading = false,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
      {...props}
    >
      {loading && <LoaderCircle aria-hidden className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}
