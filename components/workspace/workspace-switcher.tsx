"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Dropdown, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/dropdown";
import { ROLES } from "@/lib/account-data";
import { isApiMode } from "@/lib/api/config";
import { useSession } from "@/lib/api/session";
import { chooseWorkspace, workspacePath } from "@/lib/workspace-route";
import { cn } from "@/lib/utils";
import { CreateWorkspaceDialog } from "./create-workspace";

const roleLabel = (role: string) => ROLES.find((r) => r.id === role)?.label ?? role;

function Badge({ name, detail }: { name: string; detail: string }) {
  return (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-raised text-[10px] font-semibold text-zinc-300 ring-1 ring-line-strong">
        {name.trim()[0]?.toUpperCase() ?? "?"}
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-[11px] leading-tight text-zinc-500">{detail}</span>
        <span className="block truncate text-[13px] leading-tight font-medium text-zinc-100">{name}</span>
      </span>
    </>
  );
}

const BOX = "flex w-full items-center gap-2.5 rounded-lg border border-line bg-elevated px-2.5 py-2";

/** Static box while the URL is being read, and in demo mode (one local workspace). */
export function WorkspaceBox() {
  return (
    <div className={BOX}>
      <Badge name="Acme Inc" detail="Workspace" />
    </div>
  );
}

/**
 * Every workspace from /auth/me with your role, the demo one marked; picking one opens it. Outside a workspace
 * (e.g. /profile) it shows the last one used. "Create workspace" is hidden for the shared demo accounts.
 */
export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const session = useSession();
  const router = useRouter();
  const params = useParams<{ slug?: string }>();
  const [creating, setCreating] = useState(false);

  if (!isApiMode() || session.status !== "signed-in") return <WorkspaceBox />;

  const { workspaces } = session;
  const currentSlug = params.slug ?? chooseWorkspace(workspaces.map((w) => w.slug));
  const current = workspaces.find((w) => w.slug === currentSlug) ?? null;
  const canCreate = !session.user.isDemo;

  return (
    <>
      <Dropdown
        triggerLabel={current ? `Switch workspace, current: ${current.name}` : "Choose a workspace"}
        triggerClassName={cn(BOX, "text-left outline-none transition-colors hover:border-line-strong hover:bg-raised focus-visible:ring-2 focus-visible:ring-brand/50")}
        menuClassName="w-full"
        trigger={
          <>
            <Badge
              name={current?.name ?? "No workspace"}
              detail={current ? `${roleLabel(current.role)}${current.isDemo ? " · Demo" : ""}` : "Workspace"}
            />
            <ChevronsUpDown aria-hidden className="size-3.5 shrink-0 text-zinc-500" />
          </>
        }
      >
        {(close) => (
          <>
            <MenuLabel>Your workspaces</MenuLabel>
            {workspaces.map((w) => (
              <MenuItem
                key={w.id}
                hint={
                  <span className="flex items-center gap-1.5">
                    {w.isDemo && <span className="rounded bg-raised px-1 text-[10px] text-zinc-400 ring-1 ring-line-strong">Demo</span>}
                    {roleLabel(w.role)}
                  </span>
                }
                onSelect={() => {
                  close();
                  onNavigate?.();
                  router.push(workspacePath(w.slug));
                }}
              >
                <span className="flex items-center gap-1.5">
                  {w.slug === currentSlug ? <Check aria-hidden className="size-3.5 text-brand" /> : <span className="size-3.5" />}
                  <span className="truncate">{w.name}</span>
                </span>
              </MenuItem>
            ))}
            {canCreate && (
              <>
                <MenuSeparator />
                <MenuItem
                  icon={<Plus className="size-3.5" />}
                  onSelect={() => {
                    close();
                    setCreating(true);
                  }}
                >
                  Create workspace
                </MenuItem>
              </>
            )}
          </>
        )}
      </Dropdown>
      <CreateWorkspaceDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
