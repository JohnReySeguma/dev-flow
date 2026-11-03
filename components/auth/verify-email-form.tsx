"use client";

import { ArrowRight, CircleAlert, CircleCheck, Link2Off, MailCheck, MailPlus } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { resendVerification, verifyEmail } from "@/lib/api/auth";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { reloadSession, useSession } from "@/lib/api/session";

/** The card every state renders in, so the page keeps one shape from loading to the result. */
export function VerifyEmailCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[400px] animate-card-in">
      <div className="rounded-2xl border border-line-strong bg-surface/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-8">
        {children}
      </div>
    </div>
  );
}

function Message({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl border border-line-strong bg-elevated">{icon}</span>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-50">{title}</h1>
      <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-zinc-400">{children}</div>
      {action && <div className="mt-2 w-full">{action}</div>}
    </div>
  );
}

const linkButton = (href: string, label: string) => (
  <Link href={href} className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}>
    {label}
    <ArrowRight aria-hidden className="size-4" />
  </Link>
);

/** Static placeholder for the prerendered page, while the token is read from the URL. */
export function VerifyEmailSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Verifying your email…</span>
      <div aria-hidden className="size-10 rounded-xl bg-raised/70" />
      <div aria-hidden className="h-7 w-44 rounded-md bg-raised/70" />
      <div aria-hidden className="h-4 w-64 rounded bg-raised/50" />
    </div>
  );
}

/**
 * One verification per token and page load. A link works once, so a second POST (React's development double
 * effect, or a remount) would answer VERIFY_TOKEN_INVALID for a link that just worked.
 */
const attempts = new Map<string, Promise<void>>();
function verifyOnce(token: string) {
  let attempt = attempts.get(token);
  if (!attempt) {
    attempt = verifyEmail(token);
    attempts.set(token, attempt);
  }
  return attempt;
}

type Outcome = { status: "verifying" } | { status: "done" } | { status: "invalid" } | { status: "error"; error: unknown };

/** Opened from the emailed link `/verify-email?token=…` (the API's INTEGRATION §5.11). */
export function VerifyEmailForm() {
  const token = useSearchParams().get("token");
  if (!isApiMode()) {
    return (
      <Message icon={<MailCheck aria-hidden className="size-4 text-zinc-400" />} title="Nothing to verify" action={linkButton("/projects", "Open DevFlow")}>
        <p>Email verification works when DevFlow is connected to its API. The demo has no email to confirm.</p>
      </Message>
    );
  }
  if (!token) return <InvalidLink />;
  return <Verify key={token} token={token} />;
}

function Verify({ token }: { token: string }) {
  const [outcome, setOutcome] = useState<Outcome>({ status: "verifying" });
  const [attempt, setAttempt] = useState(0);
  const session = useSession();

  useEffect(() => {
    let active = true;
    verifyOnce(token)
      .then(async () => {
        // Signed in here too: refresh the profile so the "Verify your email" banner goes away.
        await reloadSession().catch(() => {});
        if (active) setOutcome({ status: "done" });
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.code === "VERIFY_TOKEN_INVALID") setOutcome({ status: "invalid" });
        else setOutcome({ status: "error", error });
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);

  if (outcome.status === "verifying") return <VerifyEmailSkeleton />;

  if (outcome.status === "done") {
    const signedIn = session.status === "signed-in";
    return (
      <Message
        icon={<CircleCheck aria-hidden className="size-4 text-emerald-400" />}
        title="Email verified"
        action={signedIn ? linkButton("/projects", "Continue to DevFlow") : linkButton("/login", "Sign in")}
      >
        <p>Thanks for confirming your address. You can now invite people to your workspaces.</p>
      </Message>
    );
  }

  if (outcome.status === "invalid") return <InvalidLink />;

  return (
    <Message
      icon={<CircleAlert aria-hidden className="size-4 text-red-400" />}
      title="We couldn't verify your email"
      action={
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            attempts.delete(token);
            setOutcome({ status: "verifying" });
            setAttempt((a) => a + 1);
          }}
        >
          Try again
        </Button>
      }
    >
      <p role="alert">{errorMessage(outcome.error)}</p>
    </Message>
  );
}

/** Unknown, used, replaced by a newer link or older than 48 hours. Signed in, a fresh link is one click away. */
function InvalidLink() {
  const session = useSession();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const user = session.status === "signed-in" ? session.user : null;

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

  if (user?.emailVerified) {
    return (
      <Message icon={<CircleCheck aria-hidden className="size-4 text-emerald-400" />} title="Your email is already verified" action={linkButton("/projects", "Continue to DevFlow")}>
        <p>
          <span className="text-zinc-200">{user.email}</span> is confirmed, so this link isn&apos;t needed any more.
        </p>
      </Message>
    );
  }

  return (
    <Message
      icon={<Link2Off aria-hidden className="size-4 text-amber-400" />}
      title="This link no longer works"
      action={
        user ? (
          sent ? undefined : (
            <Button variant="primary" size="lg" className="w-full" loading={pending} onClick={() => void resend()}>
              <MailPlus aria-hidden className="size-4" /> Send a new link
            </Button>
          )
        ) : (
          linkButton("/login", "Sign in to get a new link")
        )
      }
    >
      <p>Verification links work once and expire after 48 hours. Sending a new one also replaces the earlier link.</p>
      {sent && user && (
        <p role="status" className="text-emerald-400">
          Sent. Check {user.email} for a new link.
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
    </Message>
  );
}
