"use client";

import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useProject } from "@/components/project/project-context";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { describedBy, Field, Input, Select, Textarea } from "@/components/ui/field";
import { sprintIssues, sumPoints } from "@/lib/tracker/selectors";
import { startSprint, updateSprint, useTracker } from "@/lib/tracker/store";
import type { Sprint } from "@/lib/tracker/types";

const DURATIONS = [7, 14, 21, 28];

type SprintDialogProps = { sprint: Sprint; open: boolean; onClose: () => void };

/** Start a planned sprint: confirms name, goal and length, then opens the board. */
export function StartSprintDialog({ sprint, open, onClose }: SprintDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={`Start ${sprint.name}`} description="Committing locks in the scope you're starting with.">
      {open && <SprintForm sprint={sprint} mode="start" onDone={onClose} />}
    </Dialog>
  );
}

export function EditSprintDialog({ sprint, open, onClose }: SprintDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={`Edit ${sprint.name}`}>
      {open && <SprintForm sprint={sprint} mode="edit" onDone={onClose} />}
    </Dialog>
  );
}

function SprintForm({ sprint, mode, onDone }: { sprint: Sprint; mode: "start" | "edit"; onDone: () => void }) {
  const { project } = useProject();
  const state = useTracker();
  const router = useRouter();
  const [name, setName] = useState(sprint.name);
  const [goal, setGoal] = useState(sprint.goal);
  const [duration, setDuration] = useState(14);
  const [submitted, setSubmitted] = useState(false);

  const issues = sprintIssues(state, sprint.id);
  const unestimated = issues.filter((i) => i.estimate === null).length;
  const nameError = submitted && !name.trim() ? "A sprint needs a name." : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!name.trim()) return;
    if (mode === "edit") {
      updateSprint(sprint.id, { name: name.trim(), goal: goal.trim() });
      onDone();
      return;
    }
    startSprint(sprint.id, { name: name.trim(), goal: goal.trim(), durationDays: duration });
    onDone();
    router.push(`/projects/${project.key}/board`);
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {mode === "start" && (
        <p className="rounded-lg border border-line bg-canvas/50 px-3 py-2.5 text-[13px] text-zinc-300">
          {issues.length} issue{issues.length === 1 ? "" : "s"} · <span className="font-semibold">{sumPoints(issues)} points</span> committed
        </p>
      )}
      {mode === "start" && unestimated > 0 && (
        <p className="flex items-start gap-2 text-[12.5px] text-amber-300">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {unestimated} issue{unestimated === 1 ? " has" : "s have"} no estimate and won&apos;t count toward velocity.
        </p>
      )}
      <Field id="sprint-name" label="Name" error={nameError}>
        <Input id="sprint-name" value={name} onChange={(e) => setName(e.target.value)} {...describedBy("sprint-name", { error: nameError })} />
      </Field>
      <Field id="sprint-goal" label="Sprint goal" hint="One sentence the team can rally around.">
        <Textarea id="sprint-goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} {...describedBy("sprint-goal", { hasHint: true })} />
      </Field>
      {mode === "start" && (
        <Field id="sprint-duration" label="Duration">
          <Select id="sprint-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d / 7} week{d > 7 ? "s" : ""}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <div className="-mx-5 -mb-4 mt-2 flex justify-end gap-2 border-t border-line bg-canvas/40 px-5 py-3">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {mode === "start" ? "Start sprint" : "Save"}
        </Button>
      </div>
    </form>
  );
}
