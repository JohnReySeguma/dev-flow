"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/ui/section";
import { SESSION_USER, TEAM, type TeamMember } from "@/lib/account-data";
import { isApiMode } from "@/lib/api/config";
import { errorMessage } from "@/lib/api/errors";
import { usePermissions } from "@/lib/api/permissions";
import { useSession } from "@/lib/api/session";
import type { Workspace } from "@/lib/api/types";
import { changeRole, getWorkspace, inviteMember, listMembers, removeMember, resendInvite } from "@/lib/api/workspace";
import { resetDemoData } from "@/lib/tracker/store";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";
import { TeamMembers, type TeamActions } from "./team-members";

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
  const session = useSession();
  const { canAdmin } = usePermissions();
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
      .catch((error: unknown) => active && setLoaded({ status: "error", error }));
    return () => {
      active = false;
    };
  }, [slug, version]);

  const reload = () => setVersion((v) => v + 1);
  const name = loaded.status === "ready" ? loaded.workspace.name : "your";

  return (
    <>
      <PageHeader title="Workspace settings" description={`Manage who has access to the ${name} workspace.`} />
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
          canManage={canAdmin}
          actions={apiActions(slug)}
          onReload={reload}
        />
      )}
      {canAdmin && <DemoData />}
    </>
  );
}

function DemoData() {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <Section
      title="Demo data"
      description="Projects, sprints and issues are stored in this browser (localStorage) — nothing is sent to a server. Resetting restores the sample workspace with dates relative to today."
    >
      <div className="flex flex-wrap items-center gap-3">
        {confirming ? (
          <>
            <span className="text-[13px] text-zinc-300">Discard every change you&apos;ve made?</span>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemoData();
                setConfirming(false);
                setDone(true);
              }}
            >
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
            Sample workspace restored.
          </span>
        )}
      </div>
    </Section>
  );
}
