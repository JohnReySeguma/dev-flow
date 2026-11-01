"use client";

import { AtSign, Check, Globe, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { AVATAR_GRADIENTS, ROLES, SESSION_USER, TIMEZONES, type UserProfile } from "@/lib/account-data";
import { cn } from "@/lib/utils";

const BIO_MAX = 280;
const NAME_MAX = 48;

type Draft = Pick<UserProfile, "name" | "gradient" | "timezone" | "bio">;

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

function toDraft(profile: UserProfile): Draft {
  return { name: profile.name, gradient: profile.gradient, timezone: profile.timezone, bio: profile.bio };
}

/** Profile header + personal settings form; the header reflects saved values only. */
export function ProfileView() {
  const [profile, setProfile] = useState<UserProfile>(SESSION_USER);
  const [draft, setDraft] = useState<Draft>(() => toDraft(SESSION_USER));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 2200);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  const nameError = draft.name.trim() ? undefined : "Display name can't be empty.";
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== profile[key]);
  const role = ROLES.find((r) => r.id === profile.role);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setJustSaved(false);
  };

  function save() {
    if (nameError) return;
    setSaving(true);
    // Simulated request latency until there's an API to call.
    window.setTimeout(() => {
      setProfile((p) => ({ ...p, ...draft, name: draft.name.trim(), initials: initialsFor(draft.name) }));
      setSaving(false);
      setJustSaved(true);
    }, 600);
  }

  const previewMember = { ...profile, ...draft, initials: initialsFor(draft.name) };

  return (
    <>
      <header className="relative overflow-hidden rounded-xl border border-line bg-surface">
        <div
          aria-hidden
          className={cn("h-20 bg-gradient-to-r opacity-30", profile.gradient)}
        />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end">
          <Avatar member={profile} size="xl" className="-mt-8 ring-4 ring-surface" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight text-zinc-50">{profile.name}</h1>
              {role && (
                <span
                  title={role.description}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-muted px-1.5 py-0.5 text-[11px] font-medium text-brand-hover ring-1 ring-brand/30 ring-inset"
                >
                  <ShieldCheck aria-hidden className="size-3" />
                  {role.label}
                </span>
              )}
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-zinc-500">
              <span>{profile.email}</span>
              <span className="flex items-center gap-1">
                <AtSign aria-hidden className="size-3" />
                {profile.handle}
              </span>
              <span className="flex items-center gap-1">
                <Globe aria-hidden className="size-3" />
                {profile.timezone.replace(/_/g, " ")}
              </span>
            </p>
          </div>
        </div>
      </header>

      <Section
        title="Personal settings"
        description="How you appear to teammates on boards, comments and mentions."
        footer={
          <>
            <span aria-live="polite" className="mr-auto text-[12px] text-zinc-500">
              {justSaved ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check aria-hidden className="size-3.5" /> Changes saved
                </span>
              ) : dirty ? (
                "You have unsaved changes"
              ) : null}
            </span>
            <Button variant="ghost" disabled={!dirty || saving} onClick={() => setDraft(toDraft(profile))}>
              Discard
            </Button>
            <Button variant="primary" disabled={!dirty || !!nameError} loading={saving} onClick={save}>
              Save changes
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty) save();
          }}
          className="grid gap-6 md:grid-cols-[160px_1fr]"
        >
          <fieldset className="flex flex-col items-start gap-3">
            <legend className="mb-3 text-[13px] font-medium text-zinc-300">Avatar</legend>
            <Avatar member={previewMember} size="xl" />
            <div role="radiogroup" aria-label="Avatar color" className="flex flex-wrap gap-1.5">
              {AVATAR_GRADIENTS.map(({ value: gradient, label }) => {
                const selected = draft.gradient === gradient;
                return (
                  <button
                    key={gradient}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={label}
                    title={label}
                    onClick={() => update("gradient", gradient)}
                    className={cn(
                      "size-5 rounded-full bg-gradient-to-br outline-none transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                      gradient,
                      selected && "ring-2 ring-white ring-offset-2 ring-offset-surface",
                    )}
                  />
                );
              })}
            </div>
            <p className="text-[12px] text-zinc-500">Initials update from your display name.</p>
          </fieldset>

          <div className="flex flex-col gap-5">
            <Field id="display-name" label="Display name" error={nameError}>
              <Input
                id="display-name"
                value={draft.name}
                maxLength={NAME_MAX}
                autoComplete="name"
                onChange={(e) => update("name", e.target.value)}
                {...describedBy("display-name", { error: nameError })}
              />
            </Field>

            <Field id="timezone" label="Timezone" hint="Due dates and cycle boundaries use this zone.">
              <Select
                id="timezone"
                value={draft.timezone}
                onChange={(e) => update("timezone", e.target.value)}
                {...describedBy("timezone", { hasHint: true })}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              id="bio"
              label="Developer bio"
              hint={
                <span className="flex justify-between">
                  <span>Shown on your profile card and in @mentions.</span>
                  <span className={cn("tabular-nums", draft.bio.length > BIO_MAX - 20 && "text-amber-400")}>
                    {draft.bio.length}/{BIO_MAX}
                  </span>
                </span>
              }
            >
              <Textarea
                id="bio"
                rows={4}
                maxLength={BIO_MAX}
                value={draft.bio}
                placeholder="What do you work on?"
                onChange={(e) => update("bio", e.target.value)}
                {...describedBy("bio", { hasHint: true })}
              />
            </Field>
          </div>
        </form>
      </Section>
    </>
  );
}
