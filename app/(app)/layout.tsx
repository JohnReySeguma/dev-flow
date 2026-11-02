import type { ReactNode } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { AppSidebar } from "@/components/layout/app-sidebar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <div className="flex h-dvh flex-col lg:flex-row">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </SessionGate>
  );
}
