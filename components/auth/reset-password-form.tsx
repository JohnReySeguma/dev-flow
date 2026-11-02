"use client";

import { ArrowRight, CircleAlert, CircleCheck, Eye, EyeOff, KeyRound, Link2Off } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { resetPassword } from "@/lib/api/auth";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/errors";
import { forgetSession } from "@/lib/api/session";

const MIN = 8;
const MAX = 128;

type Outcome = "form" | "done" | "invalid-link";

/** The card every state renders in, so the page keeps one shape from loading to success. */
export function ResetPasswordCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[400px] animate-card-in">
      <div className="rounded-2xl border border-line-strong bg-surface/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-center text-[13px] text-zinc-500">
        Remembered it?{" "}
        <Link
          href="/login"
          className="rounded font-medium text-zinc-200 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Message({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl border border-line-strong bg-elevated">{icon}</span>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-50">{title}</h1>
      <div className="flex flex-col gap-2 text-[13px] leading-relaxed text-zinc-400">{children}</div>
      <div className="mt-2 w-full">{action}</div>
    </div>
  );
}

const signInLink = (label: string) => (
  <Link href="/login" className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}>
    {label}
    <ArrowRight aria-hidden className="size-4" />
  </Link>
);

/** Static placeholder for the prerendered page, while the token is read from the URL. */
export function ResetPasswordSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading…</span>
      <div aria-hidden className="h-7 w-48 rounded-md bg-raised/70" />
      <div aria-hidden className="h-4 w-64 rounded bg-raised/50" />
      <div aria-hidden className="mt-2 h-9 rounded-lg bg-raised/50" />
      <div aria-hidden className="h-9 rounded-lg bg-raised/50" />
      <div aria-hidden className="h-10 rounded-lg bg-raised/40" />
    </div>
  );
}

/** Opened from the emailed link `/reset-password?token=…` (the API's INTEGRATION §5.6). */
export function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome>("form");

  if (!isApiMode()) {
    return (
      <Message
        icon={<KeyRound aria-hidden className="size-4 text-zinc-400" />}
        title="Nothing to reset in the demo"
        action={signInLink("Back to sign in")}
      >
        <p>Password reset works when DevFlow is connected to its API. In demo mode any details sign you in.</p>
      </Message>
    );
  }

  if (!token || outcome === "invalid-link") {
    return (
      <Message
        icon={<Link2Off aria-hidden className="size-4 text-amber-400" />}
        title={token ? "This link no longer works" : "This link is incomplete"}
        action={signInLink("Request a new link")}
      >
        <p>
          {token
            ? "Reset links work once, expire after 60 minutes, and only the newest one is valid."
            : "It's missing its reset token. Open the link from the email again, or request a new one."}
        </p>
        <p>On the sign-in page, enter your email and choose “Forgot password?”.</p>
      </Message>
    );
  }

  if (outcome === "done") {
    return (
      <Message
        icon={<CircleCheck aria-hidden className="size-4 text-emerald-400" />}
        title="Password changed"
        action={signInLink("Sign in")}
      >
        <p>For your security you&apos;ve been signed out on every device. Sign in with your new password.</p>
        <p>
          Your personal access tokens were deleted too.{" "}
          <span className="text-zinc-200">Create new access tokens for scripts and the CLI</span> from your profile.
        </p>
      </Message>
    );
  }

  function validate() {
    const next: typeof errors = {};
    if (password.length < MIN) next.password = `Use at least ${MIN} characters.`;
    else if (password.length > MAX) next.password = `Use at most ${MAX} characters.`;
    if (confirm !== password) next.confirm = "The passwords don't match.";
    return next;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0 || !token) return;

    setPending(true);
    try {
      await resetPassword(token, password);
      forgetSession();
      setOutcome("done");
    } catch (error) {
      if (error instanceof ApiError && error.code === "RESET_TOKEN_INVALID") return setOutcome("invalid-link");
      const fields = fieldErrors(error);
      if (fields.password) setErrors({ password: fields.password });
      else setFormError(errorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Choose a new password</h1>
      <p className="mt-1 text-[13px] text-zinc-500">Changing it signs you out everywhere and deletes your access tokens.</p>

      <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field id="new-password" label="New password" error={errors.password} hint={`${MIN}–${MAX} characters.`}>
          <div className="relative">
            <Input
              id="new-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              className="pr-10"
              {...describedBy("new-password", { error: errors.password, hasHint: true })}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide passwords" : "Show passwords"}
              aria-pressed={show}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 outline-none hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </Field>

        <Field id="confirm-password" label="Confirm new password" error={errors.confirm}>
          <Input
            id="confirm-password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={pending}
            {...describedBy("confirm-password", { error: errors.confirm })}
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[12px] text-red-300"
          >
            <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
            {formError}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={pending}>
          Change password
        </Button>
      </form>
    </>
  );
}
