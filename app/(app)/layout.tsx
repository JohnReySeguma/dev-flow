import type { ReactNode } from "react";
import { SessionGate } from "@/components/auth/session-gate";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { VerifyEmailBanner } from "@/components/layout/verify-email-banner";

/**
 * In API mode the session is only known in the browser (its cookies belong to the API), so entering the signed-in
 * area waits on SessionGate and can't be instant; navigations between pages inside it are still validated.
 */
export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionGate>
      <div className="flex h-dvh flex-col lg:flex-row">
        <AppSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <VerifyEmailBanner />
          {children}
        </div>
      </div>
    </SessionGate>
  );
}
