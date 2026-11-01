"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section } from "@/components/ui/section";
import { SESSION_USER, TEAM, type TeamMember } from "@/lib/account-data";
import { resetDemoData } from "@/lib/tracker/store";
import { TeamMembers } from "./team-members";

export function SettingsView() {
  const [team, setTeam] = useState<TeamMember[]>(TEAM);

  return (
    <>
      <PageHeader title="Workspace settings" description="Manage who has access to the Acme Inc workspace." />
      <TeamMembers team={team} onTeamChange={setTeam} currentUserId={SESSION_USER.id} />
      <DemoData />
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
