"use client";

import { Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { CreateWorkspaceDialog } from "@/components/workspace/create-workspace";
import { errorMessage, fieldErrors } from "@/lib/api/errors";
import { reloadSession } from "@/lib/api/session";
import type { Workspace } from "@/lib/api/types";
import { renameWorkspace } from "@/lib/api/workspace";

type WorkspaceGeneralProps = {
  workspace: Workspace;
  /** Admins of a regular workspace may rename it. */
  canRename: boolean;
  /** The shared demo account can't create workspaces either. */
  isDemoAccount: boolean;
  onRenamed: (workspace: Workspace) => void;
};

/** Name and URL of the workspace; renaming keeps the slug, so links keep working. */
export function WorkspaceGeneral({ workspace, canRename, isDemoAccount, onRenamed }: WorkspaceGeneralProps) {
  const [name, setName] = useState(workspace.name);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creating, setCreating] = useState(false);
  const dirty = name.trim() !== workspace.name;

  async function save() {
    if (!name.trim()) return setError("A workspace needs a name.");
    setSaving(true);
    setError(undefined);
    try {
      const renamed = await renameWorkspace(workspace.slug, name.trim());
      onRenamed(renamed);
      setSaved(true);
      await reloadSession(); // the switcher shows the new name
    } catch (e) {
      setError(fieldErrors(e).name ?? errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Section
      title="Workspace"
      description="Its name, and the address its links use."
      footer={
        canRename && (
          <>
            {saved && !dirty && <span className="mr-auto text-[12px] text-emerald-400">Saved</span>}
            <Button variant="primary" disabled={!dirty || !name.trim()} loading={saving} onClick={() => void save()}>
              Save
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {workspace.isDemo && (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-[12.5px] text-amber-200 sm:flex-row sm:items-center">
            <Lock aria-hidden className="size-4 shrink-0" />
            <p className="flex-1">
              This is the shared demo workspace. Renaming, deleting, leaving, invites and member changes are locked; the
              projects and the sample-data reset stay open.
            </p>
            {isDemoAccount ? (
              <Link href="/signup" className="shrink-0 font-medium text-amber-100 underline-offset-2 hover:underline">
                Sign up to get your own
              </Link>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setCreating(true)}>
                <Plus aria-hidden className="size-3.5" /> Create your own workspace
              </Button>
            )}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field id="workspace-rename" label="Name" error={error}>
            <Input
              id="workspace-rename"
              value={name}
              maxLength={48}
              disabled={!canRename || saving}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
                setError(undefined);
              }}
              {...describedBy("workspace-rename", { error })}
            />
          </Field>
          <Field id="workspace-slug" label="URL" hint="Stays the same when you rename.">
            <Input id="workspace-slug" value={`/w/${workspace.slug}`} disabled className="font-mono" {...describedBy("workspace-slug", { hasHint: true })} />
          </Field>
        </div>
      </div>
      <CreateWorkspaceDialog open={creating} onClose={() => setCreating(false)} />
    </Section>
  );
}
