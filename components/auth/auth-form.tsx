"use client";

import { ArrowRight, CircleAlert, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useState, type FormEvent } from "react";
import { GitHubIcon, GoogleIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { oauthUrl, requestPasswordReset, safeRedirect } from "@/lib/api/auth";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/errors";
import { signIn, signUp } from "@/lib/api/session";
import type { AuthMe } from "@/lib/api/types";
import { usePublicConfig } from "@/lib/api/use-public-config";
import { cn } from "@/lib/utils";
import { workspacePath } from "@/lib/workspace-route";

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
    subtitle: isApiMode() ? "Sign up to join your team's DevFlow workspace." : "Any details work — this is a demo workspace.",
    submit: "Create Account",
  },
};

/** Where to go after signing in: `?next=` when it is a path on this site, otherwise the projects overview. */
function nextPath() {
  return safeRedirect(new URLSearchParams(window.location.search).get("next"));
}

/** After sign-up: `?next=` when one was given, otherwise the new account's own workspace. */
function landingAfterSignup(me: AuthMe) {
  if (new URLSearchParams(window.location.search).has("next")) return nextPath();
  const own = me.workspaces[0];
  return own ? workspacePath(own.slug) : "/welcome";
}

/** Why the API sent the browser back to `/login?error=…` after OAuth (INTEGRATION §5.5). */
const OAUTH_ERRORS: Record<string, string> = {
  oauth_denied: "Sign-in was cancelled on the provider's page.",
  oauth_state_mismatch: "That sign-in link expired or was tampered with. Please start again.",
  oauth_email_unverified:
    "Your provider account has no verified email address, so it can't be linked. Verify it there, or sign in with email.",
  oauth_account_locked: "That email belongs to a shared demo account, which can't be linked to a provider. Sign in with its email and password, or sign up.",
  oauth_failed: "The provider couldn't be reached or refused the request. Please try again.",
};

/** Reads `?error=` (URL data, so it renders below its own Suspense boundary and the page still prerenders). */
function OAuthErrorNotice() {
  const code = useSearchParams().get("error");
  if (!code) return null;
  return (
    <p
      role="alert"
      className="mt-6 flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[12px] text-red-300"
    >
      <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
      {OAUTH_ERRORS[code] ?? "Sign-in with that provider didn't complete. Please try again."}
    </p>
  );
}

/** Server-side field errors for the inputs this form has. */
function formFieldErrors(error: unknown): Errors {
  const fields = fieldErrors(error);
  return { name: fields.name, email: fields.email, password: fields.password };
}

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
  const [resetPending, setResetPending] = useState(false);
  /** A message for the whole form (wrong password, rate limit, server unreachable…). */
  const [formError, setFormError] = useState<string | null>(null);

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
    setFormError(null);
    // Re-validate live only after the first submit attempt, to avoid nagging.
    if (submitted) setErrors(validate(mode, next));
  }

  // Back from an abandoned OAuth trip, the browser may restore this page with the button still spinning.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setPending(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  // Demo mode: no backend, so simulate the auth round trip, then enter the app.
  function authenticate(via: Exclude<Pending, null>) {
    setPending(via);
    window.setTimeout(() => router.push("/projects"), 700);
  }

  /** OAuth is a full-page navigation to the API, which redirects to the provider and back (never a fetch). */
  function continueWith(provider: Provider) {
    if (!isApiMode()) return authenticate(provider);
    setPending(provider);
    window.location.assign(oauthUrl(provider, nextPath()));
  }

  async function submitToApi() {
    setPending("email");
    setFormError(null);
    try {
      if (mode === "login") {
        await signIn({ email: values.email.trim(), password: values.password });
        router.push(nextPath());
      } else {
        const me = await signUp({ name: values.name.trim(), email: values.email.trim(), password: values.password });
        router.push(landingAfterSignup(me));
      }
    } catch (error) {
      setPending(null);
      const fields = formFieldErrors(error);
      if (error instanceof ApiError && error.code === "EMAIL_TAKEN") fields.email = errorMessage(error);
      if (fields.name || fields.email || fields.password) setErrors(fields);
      else setFormError(errorMessage(error));
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors = validate(mode, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (isApiMode()) void submitToApi();
    else authenticate("email");
  }

  async function sendReset() {
    if (!EMAIL_PATTERN.test(values.email)) {
      setErrors((e) => ({ ...e, email: "Enter your email first so we know where to send the link." }));
      return;
    }
    setErrors((e) => ({ ...e, email: undefined }));
    setFormError(null);
    if (!isApiMode()) {
      setResetSentTo(values.email);
      return;
    }
    // The API answers 202 whether or not the account exists, so the notice never reveals it either.
    setResetPending(true);
    try {
      await requestPasswordReset(values.email.trim());
      setResetSentTo(values.email.trim());
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setResetPending(false);
    }
  }

  const busy = pending !== null;

  // Demo mode: both providers, simulated as before. API mode: only what GET /config enables (none if the API is
  // down), each a real OAuth redirect.
  const publicConfig = usePublicConfig();
  const providers = {
    status: publicConfig.status,
    github: publicConfig.status === "ready" && publicConfig.config.oauth.github,
    google: publicConfig.status === "ready" && publicConfig.config.oauth.google,
  };
  const hasProviders = providers.github || providers.google;

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

        {mode === "login" && isApiMode() && (
          <Suspense fallback={null}>
            <OAuthErrorNotice />
          </Suspense>
        )}

        {providers.status === "loading" ? (
          // Same footprint as the two buttons, so the form doesn't move when /config answers.
          <div role="status" aria-busy="true" className="mt-6 grid gap-2.5">
            <span className="sr-only">Loading sign-in options…</span>
            {[0, 1].map((i) => (
              <div key={i} aria-hidden className="h-10 animate-pulse rounded-lg border border-line-strong bg-raised/60" />
            ))}
          </div>
        ) : (
          hasProviders && (
            <div className="mt-6 grid gap-2.5">
              {providers.github && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  loading={pending === "github"}
                  disabled={busy}
                  onClick={() => continueWith("github")}
                >
                  {pending !== "github" && <GitHubIcon className="size-4" />}
                  Continue with GitHub
                </Button>
              )}
              {providers.google && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  loading={pending === "google"}
                  disabled={busy}
                  onClick={() => continueWith("google")}
                >
                  {pending !== "google" && <GoogleIcon className="size-4" />}
                  Continue with Google
                </Button>
              )}
            </div>
          )
        )}

        {(providers.status === "loading" || hasProviders) && (
          <div className="my-6 flex items-center gap-3 text-[11px] tracking-wide text-zinc-600 uppercase">
            <span className="h-px flex-1 bg-line" />
            or with email
            <span className="h-px flex-1 bg-line" />
          </div>
        )}

        <form noValidate onSubmit={onSubmit} className={cn("flex flex-col gap-4", providers.status !== "loading" && !hasProviders && "mt-6")}>
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
                  onClick={() => void sendReset()}
                  disabled={resetPending || busy}
                  aria-busy={resetPending || undefined}
                  className="rounded text-[12px] text-zinc-500 outline-none hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60"
                >
                  {resetPending ? "Sending link…" : "Forgot password?"}
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

          {formError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[12px] text-red-300"
            >
              <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />
              {formError}
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
