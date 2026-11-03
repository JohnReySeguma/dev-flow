"use client";

import { CircleAlert, CircleCheck, GitPullRequest, Plug, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { errorMessage } from "@/lib/api/errors";
import { disconnectGitHub, getGitHubStatus, gitHubInstallUrl } from "@/lib/api/workspace";
import type { GitHubStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";

/** Where GitHub's setup sent the browser back with `?github_error=` (INTEGRATION §7.5). */
const GITHUB_ERRORS: Record<string, string> = {
  github_denied: "GitHub wasn't connected: it was cancelled on GitHub's page.",
  github_state_mismatch: "That connection link expired or was opened in another browser. Please start again.",
  github_not_your_installation: "Your GitHub account can't access that installation. Ask whoever installed the app to connect it.",
  github_installation_taken: "That GitHub installation is already connected to another DevFlow workspace.",
  github_forbidden: "Only admins of this workspace can connect GitHub.",
  github_failed: "GitHub couldn't be reached. Please try again.",
};

type Loaded = { status: "loading" } | { status: "ready"; github: GitHubStatus } | { status: "error"; error: unknown };

type GitHubIntegrationProps = {
  slug: string;
  /** Admins of a regular workspace connect and disconnect; everyone else sees what's connected. */
  canManage: boolean;
  isDemoWorkspace: boolean;
};

/**
 * Pull requests and commits that mention an issue key (DEV-104) link to the issue, and a merged pull request moves
 * it to done. Only shown when the server can link GitHub App installations.
 */
export function GitHubIntegration({ slug, canManage, isDemoWorkspace }: GitHubIntegrationProps) {
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [version, setVersion] = useState(0);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let active = true;
    getGitHubStatus(slug)
      .then((github) => active && setLoaded({ status: "ready", github }))
      .catch((error: unknown) => active && setLoaded({ status: "error", error }));
    return () => {
      active = false;
    };
  }, [slug, version]);

  if (loaded.status === "loading") return null;
  if (loaded.status === "error") {
    return (
      <Section title="GitHub" description="We couldn't load the GitHub connection.">
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-[13px] text-red-300">
            {errorMessage(loaded.error)}
          </p>
          <Button variant="secondary" onClick={() => setVersion((v) => v + 1)}>
            Try again
          </Button>
        </div>
      </Section>
    );
  }
  if (!loaded.github.enabled) return null;

  const { installations } = loaded.github;

  async function disconnect(installationId: number) {
    setPending(installationId);
    setActionError(null);
    try {
      await disconnectGitHub(slug, installationId);
      setConfirming(null);
      setVersion((v) => v + 1);
    } catch (error) {
      setActionError(errorMessage(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <Section
      title="GitHub"
      description="Pull requests and commits that mention an issue key (e.g. DEV-104 in the title, branch or message) link to it; merging the pull request moves the issue to done."
      actions={
        canManage && (
          // A full-page navigation through the API to GitHub's install page, then back here (never a fetch).
          <Button variant="secondary" onClick={() => window.location.assign(gitHubInstallUrl(slug, `/w/${slug}/settings`))}>
            <Plug aria-hidden className="size-3.5" /> Connect GitHub
          </Button>
        )
      }
      bodyClassName="flex flex-col gap-3"
    >
      <Suspense fallback={null}>
        <ReturnFromGitHub onLinked={reload} />
      </Suspense>

      {installations.length === 0 ? (
        <p className="text-[13px] text-zinc-500">
          {isDemoWorkspace
            ? "GitHub can't be connected to the shared demo workspace. Create your own workspace to try it."
            : canManage
              ? "Not connected yet. Connect installs the DevFlow GitHub App on your account or organisation and links it here."
              : "Not connected. An admin of this workspace can connect it."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line rounded-lg border border-line">
          {installations.map((installation) => (
            <li key={installation.installationId} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <GitPullRequest aria-hidden className="size-4 text-violet-300" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-zinc-100">{installation.account}</p>
                <p className="text-[12px] text-zinc-500">Connected {formatDate(installation.linkedAt)}</p>
              </div>
              {canManage &&
                (confirming === installation.installationId ? (
                  <span className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" disabled={pending !== null} onClick={() => setConfirming(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      autoFocus
                      loading={pending === installation.installationId}
                      onClick={() => void disconnect(installation.installationId)}
                    >
                      Disconnect {installation.account}
                    </Button>
                  </span>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setConfirming(installation.installationId)}>
                    Disconnect
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
      {confirming !== null && (
        <p className="text-[12px] text-zinc-500">
          Disconnecting stops new links from GitHub; links already on issues stay. The app stays installed on GitHub until
          you uninstall it there.
        </p>
      )}
      {actionError && (
        <p role="alert" className="text-[12.5px] text-red-300">
          {actionError}
        </p>
      )}
    </Section>
  );
}

/** Reads `?github=linked` / `?github_error=…` once, shows it, and cleans the URL so a reload doesn't repeat it. */
function ReturnFromGitHub({ onLinked }: { onLinked: () => void }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const linked = params.get("github") === "linked";
  const code = params.get("github_error");
  // Read once, on arrival: the URL is cleaned straight after.
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(() =>
    linked
      ? { ok: true, text: "GitHub is connected. New pull requests and commits that mention an issue key will link to it." }
      : code
        ? { ok: false, text: GITHUB_ERRORS[code] ?? "GitHub couldn't be connected. Please try again." }
        : null,
  );

  useEffect(() => {
    if (!linked && !code) return;
    if (linked) onLinked();
    router.replace(pathname, { scroll: false });
  }, [linked, code, onLinked, router, pathname]);

  if (!notice) return null;
  return (
    <div
      role={notice.ok ? "status" : "alert"}
      className={
        notice.ok
          ? "flex items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-[12.5px] text-emerald-200"
          : "flex items-start gap-2 rounded-lg border border-red-500/25 bg-red-500/[0.06] px-3 py-2 text-[12.5px] text-red-300"
      }
    >
      {notice.ok ? <CircleCheck aria-hidden className="mt-px size-3.5 shrink-0" /> : <CircleAlert aria-hidden className="mt-px size-3.5 shrink-0" />}
      <p className="flex-1">{notice.text}</p>
      <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="rounded p-0.5 opacity-70 hover:opacity-100">
        <X className="size-3.5" />
      </button>
    </div>
  );
}
