"use client";

import { ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { GitHubIcon, GoogleIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

type Provider = "github" | "google";
type Pending = Provider | "email" | null;

type Values = { name: string; email: string; password: string };
type Errors = Partial<Record<keyof Values, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COPY: Record<AuthMode, { title: string; subtitle: string; submit: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to pick up where your team left off.",
    submit: "Sign In",
  },
  signup: {
    title: "Create your workspace",
    subtitle: "Any details work — this is a demo workspace.",
    submit: "Create Account",
  },
};

function validate(mode: AuthMode, values: Values): Errors {
  const errors: Errors = {};
  if (mode === "signup" && !values.name.trim()) errors.name = "Tell us what to call you.";
  if (!values.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(values.email)) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Password is required.";
  else if (mode === "signup" && values.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

/** 0–4: one point each for length, mixed case, a digit and a symbol. */
function passwordStrength(password: string) {
  return [
    password.length >= 8,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
}

const STRENGTH = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-400" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-400" },
  { label: "Fair", bar: "bg-amber-400", text: "text-amber-400" },
  { label: "Good", bar: "bg-sky-400", text: "text-sky-400" },
  { label: "Strong", bar: "bg-emerald-400", text: "text-emerald-400" },
] as const;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);

  // Routes stay mounted (hidden) after navigating away, so drop the pending
  // spinner and the password when this page is hidden; keep the email.
  useLayoutEffect(() => {
    return () => {
      setPending(null);
      setShowPassword(false);
      setValues((v) => ({ ...v, password: "" }));
    };
  }, []);

  const copy = COPY[mode];
  const strength = passwordStrength(values.password);
  const passwordHint = mode === "signup" ? "At least 8 characters. Mix in numbers and symbols." : undefined;

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    // Re-validate live only after the first submit attempt, to avoid nagging.
    if (submitted) setErrors(validate(mode, next));
  }

  // No backend yet: simulate the auth round trip, then enter the app.
  function authenticate(via: Exclude<Pending, null>) {
    setPending(via);
    window.setTimeout(() => router.push("/projects"), 700);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validate(mode, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) authenticate("email");
  }

  function sendReset() {
    if (!EMAIL_PATTERN.test(values.email)) {
      setErrors((e) => ({ ...e, email: "Enter your email first so we know where to send the link." }));
      return;
    }
    setErrors((e) => ({ ...e, email: undefined }));
    setResetSentTo(values.email);
  }

  const busy = pending !== null;

  return (
    <div className="w-full max-w-[400px] animate-card-in">
      <div className="rounded-2xl border border-line-strong bg-surface/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm sm:p-8">
        <nav aria-label="Authentication mode" className="grid grid-cols-2 rounded-lg border border-line bg-canvas p-0.5">
          {(
            [
              { id: "login", label: "Sign In", href: "/login" },
              { id: "signup", label: "Sign Up", href: "/signup" },
            ] as const
          ).map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={mode === tab.id ? "page" : undefined}
              className={cn(
                "rounded-md py-1.5 text-center text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand/50",
                mode === tab.id
                  ? "bg-raised text-zinc-50 shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
                  : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="mt-7">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-50">{copy.title}</h1>
          <p className="mt-1 text-[13px] text-zinc-500">{copy.subtitle}</p>
        </div>

        <div className="mt-6 grid gap-2.5">
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            loading={pending === "github"}
            disabled={busy}
            onClick={() => authenticate("github")}
          >
            {pending !== "github" && <GitHubIcon className="size-4" />}
            Continue with GitHub
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            loading={pending === "google"}
            disabled={busy}
            onClick={() => authenticate("google")}
          >
            {pending !== "google" && <GoogleIcon className="size-4" />}
            Continue with Google
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3 text-[11px] tracking-wide text-zinc-600 uppercase">
          <span className="h-px flex-1 bg-line" />
          or with email
          <span className="h-px flex-1 bg-line" />
        </div>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <Field id="name" label="Full name" error={errors.name}>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                value={values.name}
                onChange={(e) => update("name", e.target.value)}
                disabled={busy}
                {...describedBy("name", { error: errors.name })}
              />
            </Field>
          )}

          <Field id="email" label="Work email" error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={values.email}
              onChange={(e) => {
                update("email", e.target.value);
                setResetSentTo(null);
              }}
              disabled={busy}
              {...describedBy("email", { error: errors.email })}
            />
          </Field>

          <Field
            id="password"
            label="Password"
            error={errors.password}
            hint={passwordHint}
            action={
              mode === "login" && (
                <button
                  type="button"
                  onClick={sendReset}
                  className="rounded text-[12px] text-zinc-500 outline-none hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  Forgot password?
                </button>
              )
            }
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={values.password}
                onChange={(e) => update("password", e.target.value)}
                disabled={busy}
                className="pr-10"
                {...describedBy("password", { error: errors.password, hasHint: !!passwordHint })}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-zinc-500 outline-none hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </Field>

          {mode === "signup" && values.password && (
            <div className="-mt-1 flex items-center gap-3" aria-live="polite">
              <div className="grid flex-1 grid-cols-4 gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={cn(
                      "h-1 rounded-full transition-colors",
                      strength >= step ? STRENGTH[strength].bar : "bg-raised",
                    )}
                  />
                ))}
              </div>
              <span className={cn("w-14 text-right text-[11px] font-medium", STRENGTH[strength].text)}>
                {STRENGTH[strength].label}
              </span>
            </div>
          )}

          {resetSentTo && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-[12px] text-emerald-300"
            >
              <MailCheck aria-hidden className="mt-px size-3.5 shrink-0" />
              If an account exists for {resetSentTo}, a reset link is on its way.
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" className="mt-1 w-full" loading={pending === "email"} disabled={busy}>
            {copy.submit}
            {pending !== "email" && <ArrowRight aria-hidden className="size-4" />}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-[13px] text-zinc-500">
        {mode === "login" ? "New to DevFlow? " : "Already have an account? "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="rounded font-medium text-zinc-200 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </div>
  );
}
