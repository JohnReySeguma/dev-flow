"use client";

import { FolderSearch } from "lucide-react";
import Link from "next/link";
import { use, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { buttonStyles } from "@/components/ui/button";
import { findProjectByKey } from "@/lib/tracker/selectors";
import { useTracker } from "@/lib/tracker/store";
import { CreateIssueDialog } from "./create-issue-dialog";
import { IssueSheet } from "./issue-sheet";
import { ProjectContext, type CreateIssueOptions } from "./project-context";
import { ProjectHeader } from "./project-header";

type ProjectShellProps = {
  params: Promise<{ key: string }>;
  children: ReactNode;
};

/** Resolves the project from the URL and hosts project-wide UI (header, sheet, dialogs). */
export function ProjectShell({ params, children }: ProjectShellProps) {
  const { key } = use(params);
  const state = useTracker();
  const project = findProjectByKey(state, key);
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const [createOptions, setCreateOptions] = useState<CreateIssueOptions | null>(null);

  // Transient overlays shouldn't reappear when returning to a hidden route.
  useLayoutEffect(() => {
    return () => {
      setOpenIssueId(null);
      setCreateOptions(null);
    };
  }, []);

  const context = useMemo(
    () =>
      project && {
        project,
        openIssue: setOpenIssueId,
        openCreateIssue: (options: CreateIssueOptions = {}) => setCreateOptions(options),
      },
    [project],
  );

  if (!context) return <ProjectNotFound projectKey={key} />;

  return (
    <ProjectContext value={context}>
      <ProjectHeader />
      {children}
      <IssueSheet issueId={openIssueId} onClose={() => setOpenIssueId(null)} />
      <CreateIssueDialog
        options={createOptions}
        onClose={() => setCreateOptions(null)}
        onCreated={(id) => setOpenIssueId(id)}
      />
    </ProjectContext>
  );
}

function ProjectNotFound({ projectKey }: { projectKey: string }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-xl border border-line-strong bg-elevated text-zinc-400">
        <FolderSearch aria-hidden className="size-5" />
      </span>
      <h1 className="text-lg font-semibold text-zinc-100">No project called “{projectKey.toUpperCase()}”</h1>
      <p className="max-w-sm text-[13px] text-zinc-500">
        It may have been deleted, or the link is mistyped. Projects live in this browser&apos;s demo workspace.
      </p>
      <Link href="/projects" className={buttonStyles({ variant: "secondary", className: "mt-2" })}>
        Back to projects
      </Link>
    </main>
  );
}

export function ProjectShellFallback() {
  return (
    <div aria-busy className="flex flex-1 flex-col">
      <div className="h-24 border-b border-line" />
      <div className="flex flex-1 gap-3 p-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-full max-h-96 flex-1 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    </div>
  );
}
