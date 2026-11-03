"use client";

import { CircleAlert, KeyRound, Lock, Plus, Terminal, TriangleAlert, X } from "lucide-react";
import { useEffect, useLayoutEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { describedBy, Field, Input, Select } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { ACCESS_TOKENS, TOKEN_SCOPES, type AccessToken, type TokenScope } from "@/lib/account-data";
import { createAccessToken, listAccessTokens, revokeAccessToken } from "@/lib/api/auth";
import { isApiMode } from "@/lib/api/config";
import { errorMessage, fieldErrors } from "@/lib/api/errors";
import { useSession } from "@/lib/api/session";
import { useNow } from "@/lib/use-now";
import { cn, formatDate, timeAgo } from "@/lib/utils";
import { chooseWorkspace, DEMO_WORKSPACE_SLUG } from "@/lib/workspace-route";

/** `workspace`: the slug the token works in (API v2 binds every token to one workspace). */
type NewToken = { name: string; scopes: TokenScope[]; expiresInDays: number | null; workspace: string };

/** A token as listed: API tokens also say which workspace they work in (demo fixtures have none). */
type TokenRow = AccessToken & { workspace?: { id: string; slug: string; name: string } };

type WorkspaceOption = { slug: string; name: string };

/** Every page of `GET /me/tokens`, newest first. */
async function loadAllTokens(): Promise<TokenRow[]> {
  const tokens: TokenRow[] = [];
  let cursor: string | null = null;
  do {
    const page = await listAccessTokens(cursor);
    tokens.push(...page.items);
    cursor = page.nextCursor;
  } while (cursor);
  return tokens;
}

/** Demo mode keeps minting a local secret; API mode returns the server's, shown exactly once. */
async function mintToken(input: NewToken): Promise<{ token: TokenRow; secret: string }> {
  if (isApiMode()) return createAccessToken(input);
  const secret = generateSecret();
  const now = Date.now();
  return {
    secret,
    token: {
      id: `pat_${secret.slice(4, 12).toLowerCase()}`,
      name: input.name,
      lastFour: secret.slice(-4),
      scopes: input.scopes,
      createdAt: new Date(now).toISOString(),
      lastUsedAt: null,
      expiresAt: input.expiresInDays ? new Date(now + input.expiresInDays * 86_400_000).toISOString() : null,
    },
  };
}

const EXPIRY_OPTIONS = [
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
  { days: 0, label: "No expiration" },
] as const;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** `dfp_` + 36 cryptographically random base62 characters. */
function generateSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(36));
  return `dfp_${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}

export function AccessTokens() {
  const [tokens, setTokens] = useState<TokenRow[]>(isApiMode() ? [] : ACCESS_TOKENS);
  const [load, setLoad] = useState<{ status: "loading" | "ready" } | { status: "error"; error: unknown }>({
    status: isApiMode() ? "loading" : "ready",
  });
  const [attempt, setAttempt] = useState(0);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ name: string; secret: string } | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<{ id: string; message: string } | null>(null);
  const now = useNow();
  const session = useSession();
  // Tokens work in one workspace; default to the one used last (if still yours), as the profile is global.
  const defaultWorkspace =
    session.status === "signed-in" ? (chooseWorkspace(session.workspaces.map((w) => w.slug)) ?? "") : DEMO_WORKSPACE_SLUG;
  // The shared demo account can look but not generate or revoke.
  const locked = session.status === "signed-in" && session.user.isDemo;

  // Never leave a plaintext secret on screen once the page is navigated away from.
  useLayoutEffect(() => {
    return () => setRevealed(null);
  }, []);

  useEffect(() => {
    if (!isApiMode()) return;
    let active = true;
    loadAllTokens()
      .then((list) => {
        if (!active) return;
        setTokens(list);
        setLoad({ status: "ready" });
      })
      .catch((error: unknown) => active && setLoad({ status: "error", error }));
    return () => {
      active = false;
    };
  }, [attempt]);

  async function create(input: NewToken) {
    const { token, secret } = await mintToken(input);
    setTokens((t) => [token, ...t]);
    setRevealed({ name: token.name, secret });
    setCreating(false);
  }

  async function revoke(id: string) {
    setRevoking(id);
    setRevokeError(null);
    try {
      if (isApiMode()) await revokeAccessToken(id);
      setTokens((t) => t.filter((x) => x.id !== id));
      setConfirmRevokeId(null);
    } catch (error) {
      setRevokeError({ id, message: errorMessage(error) });
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Section
      id="tokens"
      title="Developer credentials"
      description="Personal access tokens authenticate the devflow CLI and REST API as you."
      actions={
        !creating &&
        !locked && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-3.5" />
            Generate token
          </Button>
        )
      }
      bodyClassName="flex flex-col gap-4"
    >
      {locked && (
        <p className="flex items-center gap-1.5 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2 text-[12.5px] text-amber-200">
          <Lock aria-hidden className="size-3.5 shrink-0" /> The shared demo account can&apos;t generate or revoke tokens. Sign up to get your own.
        </p>
      )}
      {revealed && (
        <div role="status" className="animate-pop-in rounded-lg border border-emerald-500/25 bg-emerald-500/[0.05] p-4">
          <div className="flex items-start gap-2">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-zinc-100">
                Copy “{revealed.name}” now — it won’t be shown again.
              </p>
              <div className="mt-3 flex items-center gap-2 rounded-md border border-line-strong bg-canvas py-1 pr-1 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-emerald-300">{revealed.secret}</code>
                <CopyButton value={revealed.secret} label="Copy token" />
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-canvas/60 py-1 pr-1 pl-3">
                <Terminal aria-hidden className="size-3.5 shrink-0 text-zinc-500" />
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-zinc-400">
                  devflow auth login --token {revealed.secret}
                </code>
                <CopyButton value={`devflow auth login --token ${revealed.secret}`} label="Copy CLI command" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setRevealed(null)}
              aria-label="Dismiss"
              className="rounded-md p-1 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {creating && (
        <CreateTokenForm
          workspaces={session.status === "signed-in" ? session.workspaces.map(({ slug, name }) => ({ slug, name })) : []}
          defaultWorkspace={defaultWorkspace}
          onCancel={() => setCreating(false)}
          onCreate={create}
        />
      )}

      {load.status === "loading" ? (
        <div role="status" aria-busy="true" className="flex flex-col gap-2">
          <span className="sr-only">Loading access tokens…</span>
          {[0, 1].map((i) => (
            <div key={i} aria-hidden className="h-[74px] animate-pulse rounded-lg border border-line bg-canvas/40" />
          ))}
        </div>
      ) : load.status === "error" ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/[0.05] px-4 py-3">
          <p role="alert" className="flex-1 text-[13px] text-red-300">
            {errorMessage(load.error)}
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setLoad({ status: "loading" });
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : tokens.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong py-8 text-center text-[13px] text-zinc-500">
          No active tokens. Generate one to use the CLI.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {tokens.map((token) => (
            <li key={token.id} className="flex flex-col gap-3 bg-canvas/40 px-4 py-3.5 sm:flex-row sm:items-center">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-elevated text-zinc-400">
                <KeyRound aria-hidden className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-medium text-zinc-100">{token.name}</p>
                  <code className="font-mono text-[11px] text-zinc-500">dfp_••••{token.lastFour}</code>
                  {token.workspace && (
                    <span className="rounded border border-line-strong bg-raised px-1.5 py-px text-[10.5px] text-zinc-400">
                      Works in {token.workspace.name}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {token.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="rounded border border-line-strong bg-raised px-1.5 py-px font-mono text-[10.5px] text-zinc-400"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[11.5px] text-zinc-500">
                  Created {formatDate(token.createdAt)} ·{" "}
                  {token.lastUsedAt ? `Last used ${timeAgo(token.lastUsedAt, now)}` : "Never used"} ·{" "}
                  {token.expiresAt ? `Expires ${formatDate(token.expiresAt)}` : <span className="text-amber-400/80">No expiration</span>}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 self-end sm:self-center">
                <div className="flex items-center gap-1.5">
                  <CopyButton value={token.id} label={`Copy token ID ${token.id}`} />
                  {confirmRevokeId === token.id ? (
                    <>
                      <Button size="sm" variant="ghost" disabled={revoking === token.id} onClick={() => setConfirmRevokeId(null)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        autoFocus
                        loading={revoking === token.id}
                        onClick={() => void revoke(token.id)}
                      >
                        Confirm revoke
                      </Button>
                    </>
                  ) : (
                    !locked && (
                      <Button size="sm" variant="secondary" onClick={() => setConfirmRevokeId(token.id)}>
                        Revoke
                      </Button>
                    )
                  )}
                </div>
                {revokeError?.id === token.id && (
                  <p role="alert" className="flex items-center gap-1 text-[11.5px] text-red-300">
                    <CircleAlert aria-hidden className="size-3" /> {revokeError.message}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function CreateTokenForm({
  workspaces,
  defaultWorkspace,
  onCancel,
  onCreate,
}: {
  /** The workspaces a token can be bound to (API mode); empty in demo mode. */
  workspaces: WorkspaceOption[];
  /** Preselected: the workspace used last. */
  defaultWorkspace: string;
  onCancel: () => void;
  /** Rejects with the API's error, shown in the form. */
  onCreate: (input: NewToken) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<TokenScope[]>(["issues:read"]);
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [workspace, setWorkspace] = useState(defaultWorkspace);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [server, setServer] = useState<{ fields: Record<string, string>; message: string | null }>({ fields: {}, message: null });

  const nameError = submitted && !name.trim() ? "Give the token a name you'll recognise later." : server.fields.name;
  const scopeError = submitted && scopes.length === 0 ? "Select at least one scope." : server.fields.scopes;
  const expiryError = server.fields.expiresInDays;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    setServer({ fields: {}, message: null });
    if (!name.trim() || scopes.length === 0) return;

    setPending(true);
    try {
      await onCreate({ name: name.trim(), scopes, expiresInDays: expiryDays || null, workspace });
    } catch (error) {
      // Scope errors arrive per item (`scopes.0`); show them once, on the group.
      const fields = Object.fromEntries(Object.entries(fieldErrors(error)).map(([field, message]) => [field.split(".")[0], message]));
      setServer({ fields, message: Object.keys(fields).length ? null : errorMessage(error) });
      setPending(false);
    }
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className="animate-pop-in flex flex-col gap-4 rounded-lg border border-line-strong bg-elevated/60 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
        <Field id="token-name" label="Token name" error={nameError}>
          <Input
            id="token-name"
            autoFocus
            placeholder="e.g. devflow-cli · work laptop"
            value={name}
            onChange={(e) => setName(e.target.value)}
            {...describedBy("token-name", { error: nameError })}
          />
        </Field>
        <Field id="token-expiry" label="Expiration" error={expiryError}>
          <Select
            id="token-expiry"
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            {...describedBy("token-expiry", { error: expiryError })}
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        {workspaces.length > 0 && (
          <Field
            id="token-workspace"
            label="Workspace"
            hint="The token can only reach this workspace."
            error={server.fields.workspace}
            className="sm:col-span-2"
          >
            <Select
              id="token-workspace"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              {...describedBy("token-workspace", { error: server.fields.workspace, hasHint: true })}
            >
              {workspaces.map((w) => (
                <option key={w.slug} value={w.slug}>
                  {w.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      <fieldset aria-describedby={scopeError ? "token-scopes-error" : undefined}>
        <legend className="text-[13px] font-medium text-zinc-300">Scopes</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {TOKEN_SCOPES.map(({ id, description }) => {
            const checked = scopes.includes(id);
            return (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer items-start gap-2.5 rounded-lg border p-2.5 transition-colors",
                  checked ? "border-brand/40 bg-brand-muted/40" : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => setScopes((s) => (checked ? s.filter((x) => x !== id) : [...s, id]))}
                  className="mt-0.5 size-3.5 accent-[var(--color-brand)]"
                />
                <span>
                  <span className="block font-mono text-[12px] text-zinc-200">{id}</span>
                  <span className="block text-[11.5px] text-zinc-500">{description}</span>
                </span>
              </label>
            );
          })}
        </div>
        {scopeError && (
          <p id="token-scopes-error" role="alert" className="mt-2 text-[12px] text-red-400">
            {scopeError}
          </p>
        )}
      </fieldset>

      {server.message && (
        <p role="alert" className="flex items-start gap-2 text-[12.5px] text-red-300">
          <CircleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {server.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={pending}>
          Generate token
        </Button>
      </div>
    </form>
  );
}
