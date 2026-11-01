"use client";

import { ArrowRight, CircleCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CONTACT_ENDPOINT } from "@/lib/site";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const FIELD =
  "h-10 w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3 text-[13px] text-zinc-100 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-500 hover:border-zinc-700 focus:border-brand/60 focus:ring-2 focus:ring-brand/20 aria-[invalid=true]:border-red-500/60";

/** Footer contact form: the visitor's email (and an optional note) is emailed to the site author. */
export function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const invalid = status.kind === "error" && !EMAIL_PATTERN.test(email);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = email.trim();
    if (!EMAIL_PATTERN.test(address)) {
      setStatus({ kind: "error", message: "Enter a valid email address so I can reply." });
      return;
    }
    // Bots fill hidden fields; humans don't. Pretend success and drop it.
    if (honeypot) {
      setStatus({ kind: "sent" });
      return;
    }

    setStatus({ kind: "sending" });
    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: address,
          message: message.trim() || "(no message — just wanted to connect)",
          _subject: `DevFlow portfolio: new message from ${address}`,
          _replyto: address,
          _template: "table",
          _captcha: "false",
        }),
      });
      const result = (await response.json().catch(() => null)) as { success?: string | boolean } | null;
      if (!response.ok || result?.success === false || result?.success === "false") throw new Error();
      setStatus({ kind: "sent" });
      setEmail("");
      setMessage("");
    } catch {
      setStatus({ kind: "error", message: "Couldn't send right now. Please try again in a moment." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
        <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        <div>
          <p className="text-[13px] font-medium text-zinc-100">Thanks — your message is on its way.</p>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="mt-1 rounded text-[12px] text-zinc-400 underline-offset-2 outline-none hover:text-zinc-200 hover:underline focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            Send another
          </button>
        </div>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form noValidate onSubmit={submit} className="flex w-full flex-col gap-2">
      <label htmlFor="contact-email" className="sr-only">
          Your email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          value={email}
          disabled={sending}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status.kind === "error") setStatus({ kind: "idle" });
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={status.kind === "error" ? "contact-error" : undefined}
          className={FIELD}
        />
      <label htmlFor="contact-message" className="sr-only">
        Message (optional)
      </label>
      <textarea
        id="contact-message"
        rows={2}
        maxLength={1000}
        placeholder="Message (optional) — a role, a question, feedback…"
        value={message}
        disabled={sending}
        onChange={(e) => setMessage(e.target.value)}
        className={cn(FIELD, "h-auto resize-none py-2 leading-relaxed")}
      />
      {/* Honeypot: visually hidden and skipped by keyboard and screen readers. */}
      <input
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p id="contact-error" role="alert" className="text-[12px] text-red-400">
          {status.kind === "error" ? status.message : ""}
        </p>
        <Button type="submit" variant="primary" size="lg" loading={sending} className="w-full sm:w-auto">
          Get in touch
          {!sending && <ArrowRight aria-hidden className="size-4" />}
        </Button>
      </div>
    </form>
  );
}
