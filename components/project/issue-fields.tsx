"use client";

import type { SelectHTMLAttributes } from "react";
import { Select } from "@/components/ui/field";
import { MEMBERS } from "@/lib/members";
import { projectSprints } from "@/lib/tracker/selectors";
import { ESTIMATES, ISSUE_TYPES, PRIORITIES, type Project, type TrackerState } from "@/lib/tracker/types";

/*
 * Option lists shared by the create dialog and the issue sheet, so both always
 * offer the same choices. Values are strings because <select> values are.
 */

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children">;

export const BACKLOG_VALUE = "backlog";
export const UNASSIGNED_VALUE = "none";

export function SprintSelect({ state, project, ...props }: SelectProps & { state: TrackerState; project: Project }) {
  const open = projectSprints(state, project.id).filter((s) => s.status !== "completed");
  return (
    <Select {...props}>
      <option value={BACKLOG_VALUE}>Backlog</option>
      {open.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.status === "active" ? " (active)" : ""}
        </option>
      ))}
    </Select>
  );
}

export function StatusSelect({ project, ...props }: SelectProps & { project: Project }) {
  return (
    <Select {...props}>
      {project.workflow.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </Select>
  );
}

export function TypeSelect(props: SelectProps) {
  return (
    <Select {...props}>
      {ISSUE_TYPES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.label}
        </option>
      ))}
    </Select>
  );
}

export function PrioritySelect(props: SelectProps) {
  return (
    <Select {...props}>
      {PRIORITIES.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}
        </option>
      ))}
    </Select>
  );
}

export function AssigneeSelect(props: SelectProps) {
  return (
    <Select {...props}>
      <option value={UNASSIGNED_VALUE}>Unassigned</option>
      {MEMBERS.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </Select>
  );
}

export function EstimateSelect(props: SelectProps) {
  return (
    <Select {...props}>
      <option value="">Not estimated</option>
      {ESTIMATES.map((points) => (
        <option key={points} value={points}>
          {points} {points === 1 ? "point" : "points"}
        </option>
      ))}
    </Select>
  );
}
