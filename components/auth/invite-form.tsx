"use client";

import { ArrowRight, CircleAlert, Eye, EyeOff, Link2Off, MailPlus, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, buttonStyles } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { ROLES } from "@/lib/account-data";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/errors";
import { joinWorkspace } from "@/lib/api/session";
import type { InvitePreview } from "@/lib/api/types";
import { getInvite } from "@/lib/api/workspace";
import { formatDate } from "@/lib/utils";

export function InviteCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[400px] animate-card-in">
      <div className="rounded-2xl border border-line-strong bg-surface/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-center text-[13px] text-zinc-500">
        Already have an account?{" "}
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

export function InviteSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only">Loading your invite…</span>
      <div aria-hidden className="h-7 w-44 rounded-md bg-raised/70" />
      <div aria-hidden className="h-4 w-64 rounded bg-raised/50" />
      <div aria-hidden className="mt-2 h-9 rounded-lg bg-raised/50" />
      <div aria-hidden className="h-9 rounded-lg bg-raised/50" />
      <div aria-hidden className="h-10 rounded-lg bg-raised/40" />
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

const signInButton = (
  <Link href="/login" className={buttonStyles({ variant: "primary", size: "lg", className: "w-full" })}>
    Sign in
    <ArrowRight aria-hidden className="size-4" />
  </Link>
);

type Load =
  | { status: "loading" }
  | { status: "ready"; invite: InvitePreview }
  | { status: "invalid" }
  | { status: "already-member" }
  | { status: "error"; error: unknown };

/** Opened from the emailed link `/invite?token=…` (the API's INTEGRATION §5.7). */
export function InviteForm() {
  const token = useSearchParams().get("token");
  if (!isApiMode()) {
    return (
      <Message icon={<MailPlus aria-hidden className="size-4 text-zinc-400" />} title="Invites need the API" action={signInButton}>
        <p>Invite links work when DevFlow is connected to its API. In demo mode, sign in with any details instead.</p>
      </Message>
    );
  }
  if (!token) {
    return (
      <Message icon={<Link2Off aria-hidden className="size-4 text-amber-400" />} title="This link is incomplete">
        <p>It&apos;s missing its invite token. Open the link from the email again, or ask an admin to resend the invite.</p>
      </Message>
    );
  }
  return <AcceptInvite key={token} token={token} />;
}

function AcceptInvite({ token }: { token: string }) {
  const router = useRouter();
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    getInvite(token)
      .then((invite) => active && setLoad({ status: "ready", invite }))
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.code === "INVITE_INVALID") setLoad({ status: "invalid" });
        else setLoad({ status: "error", error });
      });
    return () => {
      active = false;
    };
  }, [token, attempt]);

  if (load.status === "loading") return <InviteSkeleton />;

  if (load.status === "invalid") {
    return (
      <Message icon={<Link2Off aria-hidden className="size-4 text-amber-400" />} title="This invite no longer works">
        <p>Invite links work once and expire after 7 days. A resent invite also replaces the earlier link.</p>
        <p>Ask a workspace admin to send you a new invite.</p>
      </Message>
    );
  }

  if (load.status === "already-member") {
    return (
      <Message icon={<UserCheck aria-hidden className="size-4 text-emerald-400" />} title="You already have an account" action={signInButton}>
        <p>This email already belongs to a DevFlow account. Sign in with it instead.</p>
      </Message>
    );
  }

  if (load.status === "error") {
    return (
      <Message
        icon={<CircleAlert aria-hidden className="size-4 text-red-400" />}
        title="We couldn't load your invite"
        action={
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={() => {
              setLoad({ status: "loading" });
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        }
      >
        <p role="alert">{errorMessage(load.error)}</p>
      </Message>
    );
  }

  const { invite } = load;
  const role = ROLES.find((r) => r.id === invite.role);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Tell us what to call you.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length > 0) return;

    setPending(true);
    try {
      await joinWorkspace(token, { name: name.trim(), password });
      router.push("/projects");
    } catch (error) {
      setPending(false);
      if (error instanceof ApiError && error.code === "INVITE_INVALID") return setLoad({ status: "invalid" });
      if (error instanceof ApiError && error.code === "ALREADY_MEMBER") return setLoad({ status: "already-member" });
      const fields = fieldErrors(error);
      if (fields.name || fields.password) setErrors({ name: fields.name, password: fields.password });
      else setFormError(errorMessage(error));
    }
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight text-zinc-50">Join {invite.workspace.name}</h1>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
        {invite.invitedBy?.name ?? "An admin"} invited <span className="text-zinc-300">{invite.email}</span> as{" "}
        <span className="text-zinc-300">{role?.label ?? invite.role}</span>
        {role && <> ({role.description.toLowerCase()})</>}. The invite expires {formatDate(invite.expiresAt)}.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <Field id="invite-name" label="Full name" error={errors.name}>
          <Input
            id="invite-name"
            autoComplete="name"
            autoFocus
            maxLength={48}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            {...describedBy("invite-name", { error: errors.name })}
          />
        </Field>

        <Field id="invite-password" label="Password" error={errors.password} hint="At least 8 characters.">
          <div className="relative">
            <Input
              id="invite-password"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={pending}
              className="pr-10"
              {...describedBy("invite-password", { error: errors.password, hasHint: true })}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 outline-none hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {show ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
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
          Accept invite
          {!pending && <ArrowRight aria-hidden className="size-4" />}
        </Button>
      </form>
    </>
  );
}
