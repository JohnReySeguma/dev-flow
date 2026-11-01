import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned header content, e.g. a primary action. */
  actions?: ReactNode;
  /** Bottom bar, e.g. a form's save button and status text. */
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
};

/** Bordered settings panel with a header, body and optional footer bar. */
export function Section({
  id,
  title,
  description,
  actions,
  footer,
  className,
  bodyClassName,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-title` : undefined}
      className={cn("scroll-mt-6 overflow-hidden rounded-xl border border-line bg-surface", className)}
    >
      <header className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id={id ? `${id}-title` : undefined} className="text-sm font-semibold text-zinc-100">
            {title}
          </h2>
          {description && <p className="mt-1 text-[13px] text-zinc-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
      {footer && (
        <footer className="flex items-center justify-end gap-3 border-t border-line bg-canvas/40 px-5 py-3">
          {footer}
        </footer>
      )}
    </section>
  );
}

/** Page title block used at the top of app pages. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-50">{title}</h1>
        {description && <p className="mt-1 text-[13px] text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
