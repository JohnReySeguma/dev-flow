"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { describedBy, Field, Input, Textarea } from "@/components/ui/field";
import { useTeam } from "@/lib/tracker/team";
import { defaultStatusId } from "@/lib/tracker/selectors";
import { createIssue, useTracker } from "@/lib/tracker/store";
import type { IssueType, Priority } from "@/lib/tracker/types";
import {
  AssigneeSelect,
  BACKLOG_VALUE,
  EstimateSelect,
  PrioritySelect,
  SprintSelect,
  StatusSelect,
  TypeSelect,
  UNASSIGNED_VALUE,
} from "./issue-fields";
import { useProject, type CreateIssueOptions } from "./project-context";

type CreateIssueDialogProps = {
  /** Null = closed. */
  options: CreateIssueOptions | null;
  onClose: () => void;
  onCreated: (issueId: string) => void;
};

export function CreateIssueDialog({ options, onClose, onCreated }: CreateIssueDialogProps) {
  return (
    <Dialog open={options !== null} onClose={onClose} title="Create issue" description="New issues start in the backlog unless you pick a sprint." size="lg">
      {/* Keyed so each opening starts from a clean form with the requested defaults. */}
      {options && <CreateIssueForm key={JSON.stringify(options)} options={options} onClose={onClose} onCreated={onCreated} />}
    </Dialog>
  );
}

function CreateIssueForm({ options, onClose, onCreated }: { options: CreateIssueOptions } & Omit<CreateIssueDialogProps, "options">) {
  const { project } = useProject();
  const state = useTracker();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IssueType>("task");
  const [priority, setPriority] = useState<Priority>("medium");
  const { currentUserId } = useTeam();
  const [assignee, setAssignee] = useState(currentUserId || UNASSIGNED_VALUE);
  const [estimate, setEstimate] = useState("");
  const [sprint, setSprint] = useState(options.sprintId ?? BACKLOG_VALUE);
  const [status, setStatus] = useState(options.statusId ?? defaultStatusId(project));
  const [submitted, setSubmitted] = useState(false);

  const titleError = submitted && !title.trim() ? "Give the issue a title." : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!title.trim()) return;
    const id = createIssue(project.id, {
      title: title.trim(),
      description: description.trim(),
      type,
      priority,
      assigneeId: assignee === UNASSIGNED_VALUE ? null : assignee,
      estimate: estimate ? Number(estimate) : null,
      sprintId: sprint === BACKLOG_VALUE ? null : sprint,
      statusId: status,
    });
    onClose();
    onCreated(id);
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Field id="new-title" label="Title" error={titleError}>
        <Input
          id="new-title"
          autoFocus
          value={title}
          placeholder="e.g. Retry failed webhook deliveries"
          onChange={(e) => setTitle(e.target.value)}
          {...describedBy("new-title", { error: titleError })}
        />
      </Field>
      <Field id="new-description" label="Description">
        <Textarea
          id="new-description"
          rows={3}
          value={description}
          placeholder="Context, acceptance criteria, links…"
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="new-type" label="Type">
          <TypeSelect id="new-type" value={type} onChange={(e) => setType(e.target.value as IssueType)} />
        </Field>
        <Field id="new-priority" label="Priority">
          <PrioritySelect id="new-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)} />
        </Field>
        <Field id="new-estimate" label="Estimate">
          <EstimateSelect id="new-estimate" value={estimate} onChange={(e) => setEstimate(e.target.value)} />
        </Field>
        <Field id="new-assignee" label="Assignee">
          <AssigneeSelect id="new-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
        </Field>
        <Field id="new-sprint" label="Sprint">
          <SprintSelect id="new-sprint" state={state} project={project} value={sprint} onChange={(e) => setSprint(e.target.value)} />
        </Field>
        <Field id="new-status" label="Status">
          <StatusSelect id="new-status" project={project} value={status} onChange={(e) => setStatus(e.target.value)} />
        </Field>
      </div>

      <div className="-mx-5 -mb-4 mt-2 flex justify-end gap-2 border-t border-line bg-canvas/40 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Create issue
        </Button>
      </div>
    </form>
  );
}
