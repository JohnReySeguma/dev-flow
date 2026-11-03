"use client";

import { LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { describedBy, Field, Input } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { leaveForAnotherWorkspace } from "@/components/workspace/workspace-navigation";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { Workspace } from "@/lib/api/types";
import { deleteWorkspace, leaveWorkspace } from "@/lib/api/workspace";

/**
 * Leave (anyone) and delete (admins). Both end your access, so after the 204 /auth/me is refreshed and another
 * workspace opens, exactly as when a workspace answers 404.
 */
export function WorkspaceDangerZone({ workspace, canDelete }: { workspace: Workspace; canDelete: boolean }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<"leave" | "delete" | null>(null);
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setDialog(null);
    setTyped("");
    setError(null);
  };

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      if (dialog === "delete") await deleteWorkspace(workspace.slug);
      else await leaveWorkspace(workspace.slug);
      await leaveForAnotherWorkspace(router, workspace.slug, { force: true });
    } catch (e) {
      setPending(false);
      // LAST_ADMIN's detail says what to do (promote someone, or delete the workspace instead).
      setError(e instanceof ApiError && e.code === "LAST_ADMIN" && e.detail ? e.detail : errorMessage(e));
    }
  }

  const deleting = dialog === "delete";
  const nameMatches = typed.trim() === workspace.name;

  return (
    <Section title="Leave or delete" description="These end your access to this workspace." className="border-red-500/20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="flex-1 text-[13px] text-zinc-400">
            <span className="font-medium text-zinc-200">Leave {workspace.name}.</span> You lose access to its projects;
            your account and other workspaces stay. An admin can invite you back.
          </p>
          <Button variant="secondary" onClick={() => setDialog("leave")}>
            <LogOut aria-hidden className="size-3.5" /> Leave workspace
          </Button>
        </div>
        {canDelete && (
          <div className="flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:items-center">
            <p className="flex-1 text-[13px] text-zinc-400">
              <span className="font-medium text-zinc-200">Delete {workspace.name}.</span> Its projects, sprints, issues,
              invites and access tokens are deleted for everyone. Members keep their accounts. This can&apos;t be undone.
            </p>
            <Button variant="danger" onClick={() => setDialog("delete")}>
              <Trash2 aria-hidden className="size-3.5" /> Delete workspace
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={dialog !== null}
        onClose={close}
        size="sm"
        title={deleting ? `Delete ${workspace.name}?` : `Leave ${workspace.name}?`}
        footer={
          <>
            <Button variant="ghost" disabled={pending} onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              autoFocus={!deleting}
              loading={pending}
              disabled={deleting && !nameMatches}
              onClick={() => void confirm()}
            >
              {deleting ? "Delete workspace" : "Leave workspace"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-[13px] leading-relaxed text-zinc-400">
          {deleting ? (
            <>
              <p>Everything in it is deleted for every member, now. Accounts stay. There is no undo.</p>
              <Field
                id="confirm-workspace-name"
                label={
                  <>
                    Type <span className="text-zinc-100">{workspace.name}</span> to confirm
                  </>
                }
              >
                <Input
                  id="confirm-workspace-name"
                  autoFocus
                  autoComplete="off"
                  value={typed}
                  disabled={pending}
                  onChange={(e) => setTyped(e.target.value)}
                  {...describedBy("confirm-workspace-name", {})}
                />
              </Field>
            </>
          ) : (
            <p>You lose access right away, including your access tokens for it. An admin can invite you back later.</p>
          )}
          {error && (
            <p role="alert" className="text-[12.5px] text-red-300">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </Section>
  );
}
