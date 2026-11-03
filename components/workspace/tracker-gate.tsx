"use client";

import { CircleAlert, GitPullRequest, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { dismissGitHubChange, startLiveSync, useGitHubChange } from "@/lib/realtime/live-sync";
import { dismissTrackerError, loadWorkspace, useTrackerError, useTrackerLoad } from "@/lib/tracker/store";
import { leaveForAnotherWorkspace } from "./workspace-navigation";

/**
 * API mode: loads the workspace's projects, sprints, issues and members before its pages render (a placeholder
 * meanwhile, a retry when it fails), keeps them live with Live Sync, and reports changes the API refused. Demo mode
 * renders straight away.
 */
export function TrackerGate({ slug, fallback, children }: { slug: string; fallback: ReactNode; children: ReactNode }) {
  if (!isApiMode()) return children;
  return (
    <ApiTrackerGate slug={slug} fallback={fallback}>
      {children}
    </ApiTrackerGate>
  );
}

function ApiTrackerGate({ slug, fallback, children }: { slug: string; fallback: ReactNode; children: ReactNode }) {
  const router = useRouter();
  const load = useTrackerLoad();
  const mine = load.status !== "idle" && load.slug === slug;
  const gone = mine && load.status === "error" && load.error instanceof ApiError && load.error.code === "NOT_FOUND";

  useEffect(() => {
    void loadWorkspace(slug);
  }, [slug]);

  // 404 on the workspace itself: it was deleted or you were removed.
  useEffect(() => {
    if (gone) void leaveForAnotherWorkspace(router, slug, { force: true });
  }, [gone, router, slug]);

  // Live Sync while the workspace is open; losing access to it (membership.ended) moves you on, like a 404.
  const ready = mine && load.status === "ready";
  useEffect(() => {
    if (!ready) return;
    return startLiveSync(slug, { onMembershipEnded: () => void leaveForAnotherWorkspace(router, slug, { force: true }) });
  }, [ready, router, slug]);

  if (ready) {
    return (
      <>
        {children}
        <div className="fixed right-4 bottom-4 z-50 flex max-w-sm flex-col items-end gap-2">
          <GitHubChangeNotice />
          <RefusedChangeNotice />
        </div>
      </>
    );
  }
  if (mine && load.status === "error" && !gone) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <CircleAlert aria-hidden className="size-5 text-red-300" />
          <p className="text-[14px] font-medium text-zinc-100">We couldn&apos;t load this workspace</p>
          <p role="alert" className="text-[13px] text-zinc-400">
            {errorMessage(load.error)}
          </p>
          <Button variant="secondary" onClick={() => void loadWorkspace(slug, { force: true })}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
  return fallback;
}

/** A change the API refused; the screen has already gone back to the server's version. */
function RefusedChangeNotice() {
  const error = useTrackerError();

  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(dismissTrackerError, 8000);
    return () => window.clearTimeout(timer);
  }, [error]);

  if (!error) return null;
  return (
    <div
      key={error.id}
      role="alert"
      className="animate-pop-in flex w-full items-start gap-2 rounded-lg border border-red-500/30 bg-elevated/95 px-3.5 py-3 text-[13px] text-zinc-200 shadow-2xl shadow-black/60 backdrop-blur-md"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-red-300" />
      <p className="flex-1">
        <span className="font-medium text-zinc-100">That change wasn&apos;t saved.</span> {error.message}
      </p>
      <button
        type="button"
        onClick={dismissTrackerError}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

/** A pull request or commit linked (or a merge that moved the issue): GitHub made this change, not a teammate. */
function GitHubChangeNotice() {
  const change = useGitHubChange();

  useEffect(() => {
    if (!change) return;
    const timer = window.setTimeout(dismissGitHubChange, 8000);
    return () => window.clearTimeout(timer);
  }, [change]);

  if (!change) return null;
  const { issue } = change;
  const what = !issue.git
    ? "unlinked its pull request"
    : issue.git.kind === "pr"
      ? `linked pull request #${issue.git.number} (${issue.git.state})`
      : `linked commit ${issue.git.sha}`;
  return (
    <div
      key={change.id}
      role="status"
      className="animate-pop-in flex w-full items-start gap-2 rounded-lg border border-line-strong bg-elevated/95 px-3.5 py-3 text-[13px] text-zinc-200 shadow-2xl shadow-black/60 backdrop-blur-md"
    >
      <GitPullRequest aria-hidden className="mt-0.5 size-4 shrink-0 text-violet-300" />
      <p className="flex-1">
        <span className="font-medium text-zinc-100">{issue.id}</span> {what}{" "}
        <span className="text-zinc-500">· via GitHub</span>
      </p>
      <button
        type="button"
        onClick={dismissGitHubChange}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
