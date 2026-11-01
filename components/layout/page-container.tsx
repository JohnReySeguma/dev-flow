import type { ReactNode } from "react";

/** Scrollable content region for non-board app pages. */
export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        {children}
      </div>
    </main>
  );
}
