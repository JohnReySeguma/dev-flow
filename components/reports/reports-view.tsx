"use client";

import { ChartNoAxesColumn } from "lucide-react";
import Link from "next/link";
import { useProject } from "@/components/project/project-context";
import { buttonStyles } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { activeSprint, isDone, progressOf, projectSprints, sprintIssues } from "@/lib/tracker/selectors";
import { useTracker } from "@/lib/tracker/store";
import type { Issue, Project, Sprint } from "@/lib/tracker/types";
import { useNow } from "@/lib/use-now";
import { formatDate } from "@/lib/utils";
import { BurndownChart, LegendItem, SERIES_1, SERIES_2, VelocityChart, type BurndownDay } from "./charts";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";

const DAY = 86_400_000;

/** Remaining points at the end of each sprint day, plus the straight-line ideal. */
function burndown(project: Project, sprint: Sprint, issues: Issue[], now: number): BurndownDay[] {
  if (!sprint.startAt || !sprint.endAt) return [];
  const start = Date.parse(sprint.startAt);
  const end = Date.parse(sprint.endAt);
  const length = Math.max(1, Math.round((end - start) / DAY));
  const total = issues.reduce((s, i) => s + (i.estimate ?? 0), 0);
  const done = issues.filter((i) => isDone(project, i) && i.resolvedAt);

  return Array.from({ length: length + 1 }, (_, day) => {
    const at = start + day * DAY;
    const burned = done.filter((i) => Date.parse(i.resolvedAt!) <= at).reduce((s, i) => s + (i.estimate ?? 0), 0);
    return {
      date: new Date(at).toISOString(),
      ideal: total * (1 - day / length),
      remaining: at <= now + DAY / 2 ? total - burned : null,
    };
  });
}

export function ReportsView() {
  const { href } = useWorkspaceRoute();
  const { project } = useProject();
  const state = useTracker();
  const now = useNow();
  const sprint = activeSprint(state, project.id);
  const completed = projectSprints(state, project.id).filter((s) => s.status === "completed" && s.report);
  const recent = completed.slice(-8);
  const velocity = recent.map((s) => ({ name: s.name, committed: s.report!.committedPoints, completed: s.report!.completedPoints }));
  const lastThree = recent.slice(-3);
  const avgVelocity = lastThree.length
    ? Math.round(lastThree.reduce((sum, s) => sum + s.report!.completedPoints, 0) / lastThree.length)
    : null;

  if (!sprint && completed.length === 0) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl border border-line-strong bg-elevated text-zinc-400">
          <ChartNoAxesColumn aria-hidden className="size-5" />
        </span>
        <h2 className="text-lg font-semibold text-zinc-100">No sprint data yet</h2>
        <p className="max-w-sm text-[13px] text-zinc-500">
          Reports fill in once a sprint starts: burndown while it runs, velocity after it completes.
        </p>
        <Link href={href(`/projects/${project.key}/backlog`)} className={buttonStyles({ variant: "primary", className: "mt-2" })}>
          Plan a sprint
        </Link>
      </main>
    );
  }

  const issues = sprint ? sprintIssues(state, sprint.id) : [];
  const progress = progressOf(project, issues);
  const days = sprint ? burndown(project, sprint, issues, now) : [];
  const daysLeft = sprint?.endAt ? Math.max(0, Math.ceil((Date.parse(sprint.endAt) - now) / DAY)) : null;

  return (
    <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-6 sm:px-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Active sprint" value={sprint?.name ?? "None"} sub={sprint ? `${daysLeft}d left` : "Plan one in the backlog"} />
          <Stat label="Points done" value={sprint ? `${progress.donePoints} / ${progress.totalPoints}` : "—"} sub={sprint ? `${progress.doneIssues} of ${progress.totalIssues} issues` : ""} />
          <Stat label="Avg velocity" value={avgVelocity === null ? "—" : `${avgVelocity} pts`} sub={lastThree.length ? `Last ${lastThree.length} sprints` : "No completed sprints"} />
          <Stat label="Sprints completed" value={`${completed.length}`} sub={completed.length ? `Latest: ${completed[completed.length - 1].name}` : ""} />
        </div>

        {sprint && days.length > 0 && (
          <Section
            title={`${sprint.name} burndown`}
            description="Story points remaining at the end of each day against a straight-line ideal."
            actions={
              <div className="flex gap-3">
                <LegendItem color={SERIES_1} label="Remaining" />
                <LegendItem color="#52525b" label="Ideal" mark="dashed" />
              </div>
            }
          >
            <BurndownChart days={days} label={`Burndown for ${sprint.name}: ${progress.totalPoints - progress.donePoints} of ${progress.totalPoints} points remaining`} />
          </Section>
        )}

        {velocity.length > 0 && (
          <Section
            title="Velocity"
            description="Points committed at sprint start versus points completed."
            actions={
              <div className="flex gap-3">
                <LegendItem color={SERIES_2} label="Committed" mark="swatch" />
                <LegendItem color={SERIES_1} label="Completed" mark="swatch" />
              </div>
            }
          >
            <VelocityChart data={velocity} label={`Velocity over the last ${velocity.length} sprints`} />
          </Section>
        )}

        {completed.length > 0 && (
          <Section title="Sprint history" description="The same numbers as the velocity chart, as a table." bodyClassName="p-0">
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-line text-[11px] tracking-wide text-zinc-500 uppercase">
                    <th scope="col" className="px-5 py-2.5 font-medium">Sprint</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Ended</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Committed</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Completed</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Say/do</th>
                    <th scope="col" className="px-5 py-2.5 text-right font-medium">Carried over</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...completed].reverse().map((s) => {
                    const r = s.report!;
                    const ratio = r.committedPoints ? Math.round((r.completedPoints / r.committedPoints) * 100) : 0;
                    return (
                      <tr key={s.id} className="hover:bg-elevated/50">
                        <td className="px-5 py-3">
                          <p className="font-medium text-zinc-100">{s.name}</p>
                          {s.goal && <p className="max-w-xs truncate text-[12px] text-zinc-500">{s.goal}</p>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-zinc-400">{s.completedAt ? formatDate(s.completedAt) : "—"}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{r.committedPoints}</td>
                        <td className="px-3 py-3 text-right font-medium tabular-nums text-zinc-100">{r.completedPoints}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-zinc-300">{ratio}%</td>
                        <td className="px-5 py-3 text-right tabular-nums text-zinc-400">
                          {r.carriedOverIssues} issue{r.carriedOverIssues === 1 ? "" : "s"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface px-4 py-3">
      <p className="text-[12px] text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-zinc-50">{value}</p>
      <p className="truncate text-[12px] text-zinc-500">{sub}</p>
    </div>
  );
}
