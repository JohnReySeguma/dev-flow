import { ChevronDown } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full rounded-lg border border-line-strong bg-surface text-[13px] text-zinc-100 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 hover:border-zinc-700 focus:border-brand/60 focus:ring-2 focus:ring-brand/20 disabled:opacity-60 aria-[invalid=true]:border-red-500/60 aria-[invalid=true]:focus:ring-red-500/20";

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Extra content aligned to the right of the label, e.g. a "Forgot?" link. */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/** Label + control + hint/error, wired up for screen readers via ids. */
export function Field({ id, label, hint, error, action, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-zinc-300">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[12px] text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] text-zinc-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** aria props that link a control to its Field's hint or error message. */
export function describedBy(id: string, { error, hasHint = false }: { error?: string; hasHint?: boolean }) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-9 px-3", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "min-h-24 resize-y px-3 py-2 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-9 cursor-pointer appearance-none pr-8 pl-3", className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-500"
      />
    </div>
  );
}
