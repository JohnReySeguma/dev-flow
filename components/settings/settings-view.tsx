"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/ui/section";
import { SESSION_USER, TEAM, type TeamMember } from "@/lib/account-data";
import { isApiMode } from "@/lib/api/config";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { usePermissions } from "@/lib/api/permissions";
import { useSession } from "@/lib/api/session";
import type { Workspace } from "@/lib/api/types";
import { changeRole, getWorkspace, inviteMember, listMembers, removeMember, resendInvite } from "@/lib/api/workspace";
import { resetDemoData } from "@/lib/tracker/store";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";
import { leaveForAnotherWorkspace } from "@/components/workspace/workspace-navigation";
import { TeamMembers, type TeamActions } from "./team-members";
import { WorkspaceDangerZone } from "./workspace-danger-zone";
import { WorkspaceGeneral } from "./workspace-general";

/** Demo mode keeps today's local behaviour behind the same interface. */
const demoActions: TeamActions = {
  invite: async (email, role) => {
    const local = email.split("@")[0];
    return {
      id: `inv-${email}`,
      name: local,
      email,
      initials: local.slice(0, 2).toUpperCase(),
      gradient: "from-zinc-600 to-zinc-700",
      role,
      status: "invited",
      lastActiveAt: null,
    };
  },
  changeRole: async (member, role) => ({ ...member, role }),
  remove: async () => {},
  resend: async (member) => member,
};

/** Member changes in the workspace `slug` through the API. */
const apiActions = (slug: string): TeamActions => ({
  invite: (email, role) => inviteMember(slug, { email, role }),
  changeRole: (member, role) => changeRole(slug, member.id, role),
  remove: (member) => removeMember(slug, member.id),
  resend: (member) => resendInvite(slug, member.id),
});

export function SettingsView() {
  return isApiMode() ? <ApiSettings /> : <DemoSettings />;
}

function DemoSettings() {
  const [team, setTeam] = useState<TeamMember[]>(TEAM);
  return (
    <>
      <PageHeader title="Workspace settings" description="Manage who has access to the Acme Inc workspace." />
      <TeamMembers team={team} onTeamChange={setTeam} currentUserId={SESSION_USER.id} canManage actions={demoActions} />
      <DemoData />
    </>
  );
}

type Loaded = { status: "loading" } | { status: "ready"; workspace: Workspace } | { status: "error"; error: unknown };

function ApiSettings() {
  const { slug } = useWorkspaceRoute();
  const router = useRouter();
  const session = useSession();
  const { canAdmin, isDemoWorkspace, isDemoAccount } = usePermissions();
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getWorkspace(slug), listMembers(slug)])
      .then(([workspace, members]) => {
        if (!active) return;
        setTeam(members);
        setLoaded({ status: "ready", workspace });
      })
      .catch((error: unknown) => {
        if (!active) return;
        // 404 on the workspace itself: it was deleted or you were removed. Refresh and move on.
        if (error instanceof ApiError && error.code === "NOT_FOUND") void leaveForAnotherWorkspace(router, slug, { force: true });
        else setLoaded({ status: "error", error });
      });
    return () => {
      active = false;
    };
  }, [slug, version, router]);

  const reload = () => setVersion((v) => v + 1);
  const name = loaded.status === "ready" ? loaded.workspace.name : "your";
  // The shared demo workspace locks rename, delete, leave, invites and member changes.
  const locked = isDemoWorkspace;

  return (
    <>
      <PageHeader title="Workspace settings" description={`Manage who has access to the ${name} workspace.`} />
      {loaded.status === "ready" && (
        <WorkspaceGeneral
          key={loaded.workspace.slug}
          workspace={loaded.workspace}
          canRename={canAdmin && !locked}
          isDemoAccount={isDemoAccount}
          onRenamed={(workspace) => setLoaded({ status: "ready", workspace })}
        />
      )}
      {loaded.status === "loading" ? (
        <div role="status" aria-busy="true" className="h-80 animate-pulse rounded-xl border border-line bg-surface">
          <span className="sr-only">Loading team members…</span>
        </div>
      ) : loaded.status === "error" ? (
        <Section title="Team members" description="We couldn't load the team.">
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-[13px] text-red-300">
              {errorMessage(loaded.error)}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setLoaded({ status: "loading" });
                reload();
              }}
            >
              Try again
            </Button>
          </div>
        </Section>
      ) : (
        <TeamMembers
          team={team}
          onTeamChange={setTeam}
          currentUserId={session.status === "signed-in" ? session.user.id : ""}
          canManage={canAdmin && !locked}
          lockedReason={locked ? "Members and invites are locked in the shared demo workspace." : undefined}
          actions={apiActions(slug)}
          onReload={reload}
        />
      )}
      {/* Reset stays open in the demo workspace too. */}
      {canAdmin && <DemoData />}
      {loaded.status === "ready" && !locked && <WorkspaceDangerZone workspace={loaded.workspace} canDelete={canAdmin} />}
    </>
  );
}

/** Demo mode: a fresh local seed. API mode: the workspace's sample projects are restored on the server, for everyone. */
function DemoData() {
  const api = isApiMode();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    setPending(true);
    setError(null);
    try {
      await resetDemoData();
      setConfirming(false);
      setDone(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Section
      title={api ? "Sample data" : "Demo data"}
      description={
        api
          ? "Restores the sample projects (DEV, BIL and MOB) to their original sprints and issues, with dates relative to today, for everyone in this workspace. Projects you created stay as they are."
          : "Projects, sprints and issues are stored in this browser (localStorage) — nothing is sent to a server. Resetting restores the sample workspace with dates relative to today."
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <span className="text-[13px] text-zinc-300">
              {api ? "Undo every change to the sample projects?" : "Discard every change you’ve made?"}
            </span>
            <Button variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={pending} onClick={() => void reset()}>
              Reset demo data
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            <RotateCcw aria-hidden className="size-3.5" /> Reset demo data
          </Button>
        )}
        {done && !confirming && (
          <span role="status" className="text-[12.5px] text-emerald-400">
            {api ? "Sample projects restored." : "Sample workspace restored."}
          </span>
        )}
        {error && (
          <span role="alert" className="text-[12.5px] text-red-300">
            {error}
          </span>
        )}
      </div>
    </Section>
  );
}
