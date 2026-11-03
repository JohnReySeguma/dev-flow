"use client";

import { Eye, Link2, MessageSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import { GitBadge, TagChip, TypeIcon } from "@/components/board/badges";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/field";
import { isApiMode } from "@/lib/api/config";
import { usePermissions } from "@/lib/api/permissions";
import { deleteIssue, updateIssue, useTracker } from "@/lib/tracker/store";
import type { Issue, IssueType, Priority } from "@/lib/tracker/types";
import { useNow } from "@/lib/use-now";
import { formatDate, timeAgo } from "@/lib/utils";
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
import { IssueComments } from "./issue-comments";
import { useProject } from "./project-context";

export function IssueSheet({ issueId, onClose }: { issueId: string | null; onClose: () => void }) {
  const { issues } = useTracker();
  const issue = issueId ? (issues.find((i) => i.id === issueId) ?? null) : null;

  return (
    <Dialog
      variant="sheet"
      open={issue !== null}
      onClose={onClose}
      title={
        issue && (
          <span className="flex items-center gap-2">
            <TypeIcon type={issue.type} />
            <span className="font-mono text-[12px] text-zinc-400">{issue.id}</span>
          </span>
        )
      }
    >
      {issue && <IssueDetails key={issue.id} issue={issue} onDeleted={onClose} />}
    </Dialog>
  );
}

function IssueDetails({ issue, onDeleted }: { issue: Issue; onDeleted: () => void }) {
  const { project } = useProject();
  const state = useTracker();
  const now = useNow();
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { canWrite } = usePermissions();

  const commitTitle = () => {
    const next = title.trim();
    if (next && next !== issue.title) updateIssue(issue.id, { title: next });
    else setTitle(issue.title);
  };

  return (
    <div className="flex flex-col gap-6">
      {!canWrite && (
        <p className="flex items-center gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2 text-[12.5px] text-zinc-400">
          <Eye aria-hidden className="size-3.5 shrink-0" /> View only: viewers can read issues but not change them.
        </p>
      )}
      {/* A disabled fieldset makes every field below read-only for viewers. */}
      <fieldset disabled={!canWrite} className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-3">
          <label htmlFor="issue-title" className="sr-only">
            Title
          </label>
          <Input
            id="issue-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            className="h-auto border-transparent bg-transparent px-2 py-1.5 text-base font-semibold hover:border-line-strong"
          />
          <Field id="issue-description" label="Description">
            <Textarea
              id="issue-description"
              rows={5}
              value={description}
              placeholder="Add context, acceptance criteria or links…"
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => description !== issue.description && updateIssue(issue.id, { description })}
            />
          </Field>
        </div>
  
        <div className="grid grid-cols-2 gap-4">
          <Field id="issue-status" label="Status">
            <StatusSelect id="issue-status" project={project} value={issue.statusId} onChange={(e) => updateIssue(issue.id, { statusId: e.target.value })} />
          </Field>
          <Field id="issue-sprint" label="Sprint">
            <SprintSelect
              id="issue-sprint"
              state={state}
              project={project}
              value={issue.sprintId ?? BACKLOG_VALUE}
              onChange={(e) => updateIssue(issue.id, { sprintId: e.target.value === BACKLOG_VALUE ? null : e.target.value })}
            />
          </Field>
          <Field id="issue-assignee" label="Assignee">
            <AssigneeSelect
              id="issue-assignee"
              value={issue.assigneeId ?? UNASSIGNED_VALUE}
              onChange={(e) => updateIssue(issue.id, { assigneeId: e.target.value === UNASSIGNED_VALUE ? null : e.target.value })}
            />
          </Field>
          <Field id="issue-priority" label="Priority">
            <PrioritySelect id="issue-priority" value={issue.priority} onChange={(e) => updateIssue(issue.id, { priority: e.target.value as Priority })} />
          </Field>
          <Field id="issue-type" label="Type">
            <TypeSelect id="issue-type" value={issue.type} onChange={(e) => updateIssue(issue.id, { type: e.target.value as IssueType })} />
          </Field>
          <Field id="issue-estimate" label="Estimate">
            <EstimateSelect
              id="issue-estimate"
              value={issue.estimate ?? ""}
              onChange={(e) => updateIssue(issue.id, { estimate: e.target.value ? Number(e.target.value) : null })}
            />
          </Field>
        </div>
      </fieldset>

      {(issue.git || issue.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {issue.git && <GitBadge link={issue.git} />}
          {issue.tags.map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-line bg-canvas/40 p-3 text-[12px]">
        <dt className="text-zinc-500">Created</dt>
        <dd className="text-zinc-300">{formatDate(issue.createdAt)}</dd>
        <dt className="text-zinc-500">Updated</dt>
        <dd className="text-zinc-300">{timeAgo(issue.updatedAt, now)}</dd>
        {issue.resolvedAt && (
          <>
            <dt className="text-zinc-500">Resolved</dt>
            <dd className="text-zinc-300">{formatDate(issue.resolvedAt)}</dd>
          </>
        )}
        <dt className="text-zinc-500">Comments</dt>
        <dd className="flex items-center gap-1 text-zinc-300">
          <MessageSquare aria-hidden className="size-3" /> {issue.comments}
        </dd>
      </dl>

      {isApiMode() && <IssueComments key={issue.id} issueKey={issue.id} />}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
        <span className="flex items-center gap-1 text-[12px] text-zinc-500">
          <Link2 aria-hidden className="size-3.5" /> Copy key
          <CopyButton value={issue.id} label={`Copy ${issue.id}`} />
        </span>
        {!canWrite ? null : confirmDelete ? (
          <span className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button
              size="sm"
              variant="danger"
              autoFocus
              onClick={() => {
                onDeleted();
                deleteIssue(issue.id);
              }}
            >
              Delete {issue.id}
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setConfirmDelete(true)}>
            <Trash2 aria-hidden className="size-3.5" /> Delete
          </Button>
        )}
      </div>
    </div>
  );
}
