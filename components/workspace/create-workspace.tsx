"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { describedBy, Field, Input } from "@/components/ui/field";
import { errorMessage, fieldErrors } from "@/lib/api/errors";
import { reloadSession } from "@/lib/api/session";
import { createWorkspace } from "@/lib/api/workspace";
import { workspacePath } from "@/lib/workspace-route";

const NAME_MAX = 48;

/**
 * Name + "Start with sample projects" → `POST /workspaces`, then opens the new workspace. You become its admin.
 * Used by the switcher's dialog and by /welcome.
 */
type CreateWorkspaceFormProps = {
  onCancel?: () => void;
  /** Called once the new workspace opens, e.g. to close the dialog (it lives in the sidebar, which stays mounted). */
  onCreated?: () => void;
  submitLabel?: string;
};

export function CreateWorkspaceForm({ onCancel, onCreated, submitLabel = "Create workspace" }: CreateWorkspaceFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sampleData, setSampleData] = useState(true);
  const [nameError, setNameError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    setFormError(null);
    if (!trimmed) return setNameError("Give the workspace a name.");
    setNameError(undefined);

    setPending(true);
    try {
      const workspace = await createWorkspace({ name: trimmed, sampleData });
      // The switcher and the workspace route read /auth/me, so refresh it before opening the new workspace.
      await reloadSession();
      router.push(workspacePath(workspace.slug));
      setPending(false);
      onCreated?.();
    } catch (error) {
      setPending(false);
      const fields = fieldErrors(error);
      if (fields.name) setNameError(fields.name);
      else setFormError(errorMessage(error));
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Field id="workspace-name" label="Workspace name" error={nameError} hint="Your team, company or side project. You can rename it later.">
        <Input
          id="workspace-name"
          autoFocus
          maxLength={NAME_MAX}
          placeholder="e.g. Acme Engineering"
          value={name}
          disabled={pending}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(undefined);
          }}
          {...describedBy("workspace-name", { error: nameError, hasHint: true })}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-line p-3 transition-colors hover:border-line-strong">
        <input
          type="checkbox"
          checked={sampleData}
          disabled={pending}
          onChange={(e) => setSampleData(e.target.checked)}
          className="mt-0.5 size-3.5 accent-[var(--color-brand)]"
        />
        <span>
          <span className="block text-[13px] font-medium text-zinc-200">Start with sample projects</span>
          <span className="block text-[12px] text-zinc-500">
            Copies the DEV, BIL and MOB demo projects so you have a board to try. You can reset or delete them later.
          </span>
        </span>
      </label>

      {formError && (
        <p role="alert" className="text-[12.5px] text-red-300">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="ghost" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={pending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function CreateWorkspaceDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Create workspace" description="A private space for a team: its own projects, members and roles. You'll be its admin.">
      {open && <CreateWorkspaceForm onCancel={onClose} onCreated={onClose} />}
    </Dialog>
  );
}
