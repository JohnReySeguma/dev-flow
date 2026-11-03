"use client";

import { MailWarning, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { resendVerification } from "@/lib/api/auth";
import { errorMessage } from "@/lib/api/errors";
import { useSession } from "@/lib/api/session";
import { usePublicConfig } from "@/lib/api/use-public-config";

/**
 * "Verify your email" while the signed-in account hasn't confirmed its address and the server really sends email
 * (`GET /config` → `email: true`); until then it can't invite people. Resend mails a fresh link.
 */
export function VerifyEmailBanner() {
  const session = useSession();
  const config = usePublicConfig();
  const [dismissed, setDismissed] = useState(false);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.status !== "signed-in" || session.user.emailVerified || dismissed) return null;
  if (config.status !== "ready" || !config.config.email) return null;

  async function resend() {
    setPending(true);
    setError(null);
    try {
      await resendVerification();
      setSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="region"
      aria-label="Verify your email"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 text-[12.5px] text-amber-100"
    >
      <MailWarning aria-hidden className="size-4 shrink-0 text-amber-300" />
      <p className="min-w-0 flex-1">
        <span className="font-medium">Verify your email.</span> We sent a link to {session.user.email}; until you open it,
        you can&apos;t invite people.
      </p>
      {sent ? (
        <span role="status" className="text-emerald-300">
          Sent. Check your inbox.
        </span>
      ) : (
        <Button size="sm" variant="secondary" loading={pending} onClick={() => void resend()}>
          Resend link
        </Button>
      )}
      {error && (
        <span role="alert" className="text-red-300">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded-md p-1 text-amber-200/70 outline-none hover:bg-amber-500/10 hover:text-amber-100 focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
