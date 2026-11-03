"use client";

import { AtSign, Check, CircleAlert, Globe, Lock, RotateCcw, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { AVATAR_GRADIENTS, ROLES, SESSION_USER, TIMEZONES, type UserProfile as FixtureProfile } from "@/lib/account-data";
import { getProfile, updateProfile } from "@/lib/api/auth";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/errors";
import { setSessionUser, useSession } from "@/lib/api/session";
import type { UpdateProfileRequest, UserProfile as ApiUserProfile } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const BIO_MAX = 280;
const NAME_MAX = 48;

/** The profile as the editor shows it. API v2 profiles have no role (roles are per workspace); demo mode has one. */
type UserProfile = Omit<FixtureProfile, "role"> & { role?: FixtureProfile["role"] };

type Draft = Pick<UserProfile, "name" | "gradient" | "timezone" | "bio">;
type DraftErrors = Partial<Record<keyof Draft, string>>;

/** What a save handler resolves with: the saved profile, or the error to show. */
type SaveResult = { profile: UserProfile } | { error: unknown };

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : (parts[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

function toDraft(profile: UserProfile): Draft {
  return { name: profile.name, gradient: profile.gradient, timezone: profile.timezone, bio: profile.bio };
}

/** The API's profile has no presence; you are online when you're looking at your own profile. */
const fromApi = (profile: ApiUserProfile): UserProfile => ({ ...profile, presence: "online" });

/** Profile header + personal settings: the fixture user in demo mode, `GET /me` / `PATCH /me` in API mode. */
export function ProfileView() {
  return isApiMode() ? <ApiProfile /> : <ProfileEditor initial={SESSION_USER} onSave={saveDemo} />;
}

// Demo mode keeps the simulated round trip.
function saveDemo(profile: UserProfile, draft: Draft): Promise<SaveResult> {
  return new Promise((resolve) =>
    window.setTimeout(
      () => resolve({ profile: { ...profile, ...draft, name: draft.name.trim(), initials: initialsFor(draft.name) } }),
      600,
    ),
  );
}

type Loaded = { status: "loading" } | { status: "ready"; profile: UserProfile } | { status: "error"; error: unknown };

function ApiProfile() {
  const session = useSession();
  // The shared demo account is read-only; the API would answer DEMO_ACCOUNT_LOCKED anyway.
  const locked = session.status === "signed-in" && session.user.isDemo;
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  // Bumped to re-fetch and remount the editor with fresh values (after a conflict, or "Try again").
  const [version, setVersion] = useState(0);
  /** The ETag of the last profile the server returned, sent back as If-Match. */
  const etag = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    getProfile()
      .then((loadedProfile) => {
        if (!active) return;
        etag.current = loadedProfile.etag;
        setLoaded({ status: "ready", profile: fromApi(loadedProfile.profile) });
      })
      .catch((error: unknown) => active && setLoaded({ status: "error", error }));
    return () => {
      active = false;
    };
  }, [version]);

  const reload = () => {
    setLoaded({ status: "loading" });
    setVersion((v) => v + 1);
  };

  if (loaded.status === "loading") return <ProfileSkeleton />;

  if (loaded.status === "error") {
    return (
      <Section title="Personal settings" description="We couldn't load your profile.">
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-[13px] text-red-300">
            {errorMessage(loaded.error)}
          </p>
          <Button variant="secondary" onClick={reload}>
            Try again
          </Button>
        </div>
      </Section>
    );
  }

  async function save(profile: UserProfile, draft: Draft): Promise<SaveResult> {
    // Send only what changed, so another tab's edit to a different field is never clobbered silently.
    const patch: UpdateProfileRequest = {};
    if (draft.name.trim() !== profile.name) patch.name = draft.name.trim();
    if (draft.gradient !== profile.gradient) patch.gradient = draft.gradient as UpdateProfileRequest["gradient"];
    if (draft.timezone !== profile.timezone) patch.timezone = draft.timezone;
    if (draft.bio !== profile.bio) patch.bio = draft.bio;
    try {
      const saved = await updateProfile(patch, etag.current);
      etag.current = saved.etag;
      setSessionUser(saved.profile);
      return { profile: fromApi(saved.profile) };
    } catch (error) {
      return { error };
    }
  }

  return <ProfileEditor key={version} initial={loaded.profile} locked={locked} onSave={save} onReload={reload} />;
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Loading your profile…</span>
      <div aria-hidden className="h-36 animate-pulse rounded-xl border border-line bg-surface" />
      <div aria-hidden className="h-96 animate-pulse rounded-xl border border-line bg-surface" />
    </div>
  );
}

type EditorProps = {
  initial: UserProfile;
  onSave: (profile: UserProfile, draft: Draft) => Promise<SaveResult>;
  /** Offered after a conflict: discard the draft and load the latest saved profile. */
  onReload?: () => void;
  /** Read-only (the shared demo account): fields disabled, no save. */
  locked?: boolean;
};

/** Header + form; the header reflects saved values only. */
function ProfileEditor({ initial, onSave, onReload, locked = false }: EditorProps) {
  const [profile, setProfile] = useState<UserProfile>(initial);
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [serverErrors, setServerErrors] = useState<DraftErrors>({});
  const [saveError, setSaveError] = useState<{ message: string; stale: boolean } | null>(null);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 2200);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  const nameError = draft.name.trim() ? serverErrors.name : "Display name can't be empty.";
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((key) => draft[key] !== profile[key]);
  const role = ROLES.find((r) => r.id === profile.role);
  // The API accepts any IANA zone; keep the saved one selectable even if it isn't in the short list.
  const timezones = TIMEZONES.includes(draft.timezone as (typeof TIMEZONES)[number]) ? TIMEZONES : [draft.timezone, ...TIMEZONES];

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setJustSaved(false);
    setServerErrors((e) => ({ ...e, [key]: undefined }));
    setSaveError(null);
  };

  async function save() {
    if (!draft.name.trim()) return;
    setSaving(true);
    setSaveError(null);
    const result = await onSave(profile, draft);
    setSaving(false);
    if ("profile" in result) {
      setProfile(result.profile);
      setDraft(toDraft(result.profile));
      setJustSaved(true);
      return;
    }
    const fields = fieldErrors(result.error) as DraftErrors;
    if (fields.name || fields.gradient || fields.timezone || fields.bio) return setServerErrors(fields);
    const stale = result.error instanceof ApiError && result.error.code === "CONFLICT_STALE";
    setSaveError({ message: errorMessage(result.error), stale });
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
          locked ? (
            <p className="mr-auto flex items-center gap-1.5 text-[12px] text-amber-200">
              <Lock aria-hidden className="size-3.5 shrink-0" /> The shared demo account is read-only. Sign up to edit your own profile.
            </p>
          ) : (
            <>
              <span aria-live="polite" className="mr-auto text-[12px] text-zinc-500">
                {saveError ? (
                  <span role="alert" className="flex items-center gap-1.5 text-red-300">
                    <CircleAlert aria-hidden className="size-3.5 shrink-0" /> {saveError.message}
                  </span>
                ) : justSaved ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Check aria-hidden className="size-3.5" /> Changes saved
                  </span>
                ) : dirty ? (
                  "You have unsaved changes"
                ) : null}
              </span>
              {saveError?.stale && onReload ? (
                <Button variant="secondary" onClick={onReload}>
                  <RotateCcw aria-hidden className="size-3.5" /> Load latest
                </Button>
              ) : (
                <Button variant="ghost" disabled={!dirty || saving} onClick={() => setDraft(toDraft(profile))}>
                  Discard
                </Button>
              )}
              <Button variant="primary" disabled={!dirty || !!nameError} loading={saving} onClick={() => void save()}>
                Save changes
              </Button>
            </>
          )
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty) void save();
          }}
        >
          <fieldset disabled={locked} className="grid min-w-0 gap-6 md:grid-cols-[160px_1fr]">
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
              {serverErrors.gradient ? (
                <p role="alert" className="text-[12px] text-red-400">
                  {serverErrors.gradient}
                </p>
              ) : (
                <p className="text-[12px] text-zinc-500">Initials update from your display name.</p>
              )}
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

              <Field id="timezone" label="Timezone" hint="Due dates and cycle boundaries use this zone." error={serverErrors.timezone}>
                <Select
                  id="timezone"
                  value={draft.timezone}
                  onChange={(e) => update("timezone", e.target.value)}
                  {...describedBy("timezone", { error: serverErrors.timezone, hasHint: true })}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                id="bio"
                label="Developer bio"
                error={serverErrors.bio}
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
                  {...describedBy("bio", { error: serverErrors.bio, hasHint: true })}
                />
              </Field>
            </div>
          </fieldset>
        </form>
      </Section>
    </>
  );
}
