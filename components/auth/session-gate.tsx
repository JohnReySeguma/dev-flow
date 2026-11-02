"use client";

import { CloudOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { LogoMark } from "@/components/ui/logo";
import { errorMessage } from "@/lib/api/errors";
import { checkSession, useSession } from "@/lib/api/session";

function Screen({ children }: { children: ReactNode }) {
  return <main className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-4 px-6 text-center">{children}</main>;
}

/**
 * Signed-in routes in API mode: renders the app only once `GET /auth/me` confirms a session, sends signed-out
 * visitors to /login (coming back here afterwards), and offers a retry when the API can't answer.
 * Demo mode renders the app straight away, as before.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    if (session.status !== "signed-out") return;
    if (session.reason === "logout") {
      router.replace("/login");
      return;
    }
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(`/login?next=${encodeURIComponent(here)}`);
  }, [session, router]);

  if (session.status === "demo" || session.status === "signed-in") return children;

  if (session.status === "error") {
    return (
      <Screen>
        <span className="flex size-11 items-center justify-center rounded-xl border border-line-strong bg-elevated text-zinc-400">
          <CloudOff aria-hidden className="size-5" />
        </span>
        <h1 className="text-lg font-semibold text-zinc-100">Can&apos;t check your session</h1>
        <p role="alert" className="max-w-sm text-[13px] text-zinc-500">
          {errorMessage(session.error)}
        </p>
        <div className="mt-2 flex gap-2">
          <Link href="/" className={buttonStyles({ variant: "ghost" })}>
            Home
          </Link>
          <Button
            variant="primary"
            loading={retrying}
            onClick={async () => {
              setRetrying(true);
              await checkSession();
              setRetrying(false);
            }}
          >
            Try again
          </Button>
        </div>
      </Screen>
    );
  }

  // Loading, or signed out and about to be redirected.
  return (
    <Screen>
      <div role="status" aria-busy="true" className="flex flex-col items-center gap-4">
        <LogoMark className="size-9" />
        <span className="flex items-center gap-2 text-[13px] text-zinc-500">
          <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
          {session.status === "signed-out" ? "Taking you to sign in…" : "Checking your session…"}
        </span>
      </div>
    </Screen>
  );
}
