"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProject } from "@/components/project/project-context";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { progressOf, projectSprints, sprintIssues } from "@/lib/tracker/selectors";
import { completeSprint, useTracker, type CarryOver } from "@/lib/tracker/store";
import type { Sprint } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";

export function CompleteSprintDialog({ sprint, open, onClose }: { sprint: Sprint; open: boolean; onClose: () => void }) {
  const { href } = useWorkspaceRoute();
  const { project } = useProject();
  const state = useTracker();
  const router = useRouter();
  const planned = projectSprints(state, project.id).filter((s) => s.status === "planned");
  const [target, setTarget] = useState<string>(planned[0]?.id ?? "backlog");

  const progress = progressOf(project, sprintIssues(state, sprint.id));
  const openCount = progress.totalIssues - progress.doneIssues;

  const options: { value: string; label: string; hint: string }[] = [
    ...planned.map((s) => ({ value: s.id, label: s.name, hint: "Planned sprint" })),
    { value: "new", label: `New sprint`, hint: "Creates the next sprint" },
    { value: "backlog", label: "Backlog", hint: "Re-plan them later" },
  ];

  function confirm() {
    const carryOver: CarryOver =
      target === "backlog" ? { kind: "backlog" } : target === "new" ? { kind: "new-sprint" } : { kind: "sprint", sprintId: target };
    completeSprint(sprint.id, carryOver);
    onClose();
    router.push(href(`/projects/${project.key}/reports`));
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Complete ${sprint.name}`}
      description="Closes the sprint, records its report and frees the board for the next one."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirm}>
            Complete sprint
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Tile label="Completed" value={`${progress.doneIssues} issues`} sub={`${progress.donePoints} points`} />
        <Tile label="Unfinished" value={`${openCount} issues`} sub={`${progress.totalPoints - progress.donePoints} points`} />
      </div>

      {openCount > 0 ? (
        <fieldset className="mt-5">
          <legend className="text-[13px] font-medium text-zinc-300">Move {openCount} unfinished issue{openCount > 1 ? "s" : ""} to</legend>
          <div className="mt-2 flex flex-col gap-2">
            {options.map((o) => (
              <label
                key={o.value}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] transition-colors",
                  target === o.value ? "border-brand/50 bg-brand-muted/40" : "border-line hover:border-line-strong",
                )}
              >
                <input
                  type="radio"
                  name="carry-over"
                  value={o.value}
                  checked={target === o.value}
                  onChange={() => setTarget(o.value)}
                  className="accent-[var(--color-brand)]"
                />
                <span className="flex-1 text-zinc-200">{o.label}</span>
                <span className="text-[12px] text-zinc-500">{o.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2.5 text-[13px] text-emerald-300">
          Every issue is done. Nice sprint.
        </p>
      )}
    </Dialog>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-line bg-canvas/50 px-3 py-2.5">
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-100">{value}</p>
      <p className="text-[12px] text-zinc-500">{sub}</p>
    </div>
  );
}
