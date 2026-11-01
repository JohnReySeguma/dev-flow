"use client";

import { KeyRound, Plus, Terminal, TriangleAlert, X } from "lucide-react";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { describedBy, Field, Input, Select } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { ACCESS_TOKENS, TOKEN_SCOPES, type AccessToken, type TokenScope } from "@/lib/account-data";
import { useNow } from "@/lib/use-now";
import { cn, formatDate, timeAgo } from "@/lib/utils";

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
  const [tokens, setTokens] = useState<AccessToken[]>(ACCESS_TOKENS);
  const [creating, setCreating] = useState(false);
  const [revealed, setRevealed] = useState<{ name: string; secret: string } | null>(null);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const now = useNow();

  // Never leave a plaintext secret on screen once the page is navigated away from.
  useLayoutEffect(() => {
    return () => setRevealed(null);
  }, []);

  function create(token: AccessToken, secret: string) {
    setTokens((t) => [token, ...t]);
    setRevealed({ name: token.name, secret });
    setCreating(false);
  }

  return (
    <Section
      id="tokens"
      title="Developer credentials"
      description="Personal access tokens authenticate the devflow CLI and REST API as you."
      actions={
        !creating && (
          <Button variant="secondary" onClick={() => setCreating(true)}>
            <Plus aria-hidden className="size-3.5" />
            Generate token
          </Button>
        )
      }
      bodyClassName="flex flex-col gap-4"
    >
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

      {creating && <CreateTokenForm onCancel={() => setCreating(false)} onCreate={create} />}

      {tokens.length === 0 ? (
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

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <CopyButton value={token.id} label={`Copy token ID ${token.id}`} />
                {confirmRevokeId === token.id ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setConfirmRevokeId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      autoFocus
                      onClick={() => {
                        setTokens((t) => t.filter((x) => x.id !== token.id));
                        setConfirmRevokeId(null);
                      }}
                    >
                      Confirm revoke
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setConfirmRevokeId(token.id)}>
                    Revoke
                  </Button>
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
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (token: AccessToken, secret: string) => void;
}) {
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<TokenScope[]>(["issues:read"]);
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [submitted, setSubmitted] = useState(false);

  const nameError = submitted && !name.trim() ? "Give the token a name you'll recognise later." : undefined;
  const scopeError = submitted && scopes.length === 0 ? "Select at least one scope." : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim() || scopes.length === 0) return;

    const secret = generateSecret();
    const now = Date.now();
    onCreate(
      {
        id: `pat_${secret.slice(4, 12).toLowerCase()}`,
        name: name.trim(),
        lastFour: secret.slice(-4),
        scopes,
        createdAt: new Date(now).toISOString(),
        lastUsedAt: null,
        expiresAt: expiryDays ? new Date(now + expiryDays * 86_400_000).toISOString() : null,
      },
      secret,
    );
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
        <Field id="token-expiry" label="Expiration">
          <Select id="token-expiry" value={expiryDays} onChange={(e) => setExpiryDays(Number(e.target.value))}>
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.days} value={o.days}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
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

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Generate token
        </Button>
      </div>
    </form>
  );
}
