"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StatusCategoryIcon } from "@/components/board/kanban-column";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Section } from "@/components/ui/section";
import { usePermissions } from "@/lib/api/permissions";
import { cannotDeleteStatusReason } from "@/lib/tracker/selectors";
import {
  addStatus,
  deleteProject,
  deleteStatus,
  moveStatus,
  updateProject,
  updateStatus,
  useTracker,
} from "@/lib/tracker/store";
import { STATUS_CATEGORIES, type StatusCategory, type WorkflowStatus } from "@/lib/tracker/types";
import { cn } from "@/lib/utils";
import { useProject } from "./project-context";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";

export function ProjectSettings() {
  // Members may rename projects; only admins edit the workflow or delete the project.
  const { canWrite, canAdmin } = usePermissions();
  return (
    <main className="scroll-thin min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        <GeneralSettings readOnly={!canWrite} />
        <WorkflowEditor readOnly={!canAdmin} />
        {canAdmin && <DangerZone />}
      </div>
    </main>
  );
}

function GeneralSettings({ readOnly }: { readOnly: boolean }) {
  const { project } = useProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [saved, setSaved] = useState(false);
  const dirty = name.trim() !== project.name || description.trim() !== project.description;

  return (
    <Section
      title="General"
      description="Shown in the sidebar, project list and issue keys."
      footer={
        !readOnly && (
          <>
            {saved && !dirty && <span className="mr-auto text-[12px] text-emerald-400">Saved</span>}
            <Button
              variant="primary"
              disabled={!dirty || !name.trim()}
              onClick={() => {
                updateProject(project.id, { name: name.trim(), description: description.trim() });
                setSaved(true);
              }}
            >
              Save
            </Button>
          </>
        )
      }
    >
      <fieldset disabled={readOnly} className="grid min-w-0 gap-4 sm:grid-cols-[1fr_120px]">
        <Field id="project-name" label="Name">
          <Input id="project-name" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field id="project-key" label="Key" hint="Fixed once issues exist.">
          <Input id="project-key" value={project.key} disabled className="font-mono" />
        </Field>
        <Field id="project-description" label="Description" className="sm:col-span-2">
          <Textarea id="project-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </fieldset>
    </Section>
  );
}

function WorkflowEditor({ readOnly }: { readOnly: boolean }) {
  const { project } = useProject();
  const { issues } = useTracker();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<StatusCategory>("in_progress");
  const counts = new Map<string, number>();
  for (const i of issues) if (i.projectId === project.id) counts.set(i.statusId, (counts.get(i.statusId) ?? 0) + 1);

  return (
    <Section
      title="Workflow"
      description={
        readOnly
          ? "The board's columns, left to right. Only admins can change the workflow."
          : "The board's columns, left to right. Each status counts as To do, In progress or Done; Done statuses complete issues and drive burndown."
      }
      bodyClassName="flex flex-col gap-4"
    >
      <fieldset disabled={readOnly} className="min-w-0">
        <ol className="divide-y divide-line overflow-hidden rounded-lg border border-line">
          {project.workflow.map((status, index) => (
            <WorkflowRow
              key={status.id}
              status={status}
              index={index}
              total={project.workflow.length}
              issueCount={counts.get(status.id) ?? 0}
              fallback={project.workflow[index === 0 ? 1 : index - 1]}
            />
          ))}
        </ol>
      </fieldset>

      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addStatus(project.id, name.trim(), category);
            setName("");
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="add-status-name" className="sr-only">
            New status name
          </label>
          <Input id="add-status-name" placeholder="New status, e.g. QA" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-2">
            <div className="w-36">
              <label htmlFor="add-status-category" className="sr-only">
                Category
              </label>
              <Select id="add-status-category" value={category} onChange={(e) => setCategory(e.target.value as StatusCategory)}>
                {STATUS_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" variant="secondary" className="h-9" disabled={!name.trim()}>
              <Plus aria-hidden className="size-3.5" /> Add
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}

function WorkflowRow({
  status,
  index,
  total,
  issueCount,
  fallback,
}: {
  status: WorkflowStatus;
  index: number;
  total: number;
  issueCount: number;
  fallback: WorkflowStatus | undefined;
}) {
  const { project } = useProject();
  const [confirming, setConfirming] = useState(false);
  const blocked = cannotDeleteStatusReason(project, status.id);
  const iconButton =
    "rounded-md p-1.5 text-zinc-500 outline-none hover:bg-raised hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50 disabled:pointer-events-none disabled:opacity-30";

  return (
    <li className="bg-canvas/40 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusCategoryIcon category={status.category} />
        <label htmlFor={`status-name-${status.id}`} className="sr-only">
          Status name
        </label>
        <input
          // Remount when renamed elsewhere (e.g. from the board) so the field isn't stale.
          key={status.name}
          id={`status-name-${status.id}`}
          defaultValue={status.name}
          maxLength={24}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (value && value !== status.name) updateStatus(project.id, status.id, { name: value });
            else e.target.value = status.name;
          }}
          className="h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[13px] font-medium text-zinc-100 outline-none hover:border-line-strong focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
        />
        <span className="text-[12px] tabular-nums text-zinc-500">{issueCount} {issueCount === 1 ? "issue" : "issues"}</span>
        <div className="w-32">
          <label htmlFor={`status-category-${status.id}`} className="sr-only">
            Category for {status.name}
          </label>
          <Select
            id={`status-category-${status.id}`}
            value={status.category}
            onChange={(e) => updateStatus(project.id, status.id, { category: e.target.value as StatusCategory })}
            className="h-8 text-[12.5px]"
          >
            {STATUS_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>
        <button type="button" aria-label={`Move ${status.name} up`} disabled={index === 0} onClick={() => moveStatus(project.id, status.id, -1)} className={iconButton}>
          <ArrowUp className="size-3.5" />
        </button>
        <button type="button" aria-label={`Move ${status.name} down`} disabled={index === total - 1} onClick={() => moveStatus(project.id, status.id, 1)} className={iconButton}>
          <ArrowDown className="size-3.5" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${status.name}`}
          title={blocked ?? undefined}
          disabled={!!blocked}
          onClick={() => setConfirming(true)}
          className={cn(iconButton, "hover:text-red-300")}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
      {confirming && fallback && (
        <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 rounded-md bg-red-500/[0.06] px-3 py-2 text-[12.5px] text-zinc-300">
          <span className="flex-1">
            Delete “{status.name}”?{issueCount > 0 && ` ${issueCount} issue${issueCount > 1 ? "s" : ""} will move to “${fallback.name}”.`}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button size="sm" variant="danger" onClick={() => deleteStatus(project.id, status.id, fallback.id)}>
            Delete
          </Button>
        </div>
      )}
    </li>
  );
}

function DangerZone() {
  const { href } = useWorkspaceRoute();
  const { project } = useProject();
  const router = useRouter();
  const [typed, setTyped] = useState("");

  return (
    <Section title="Delete project" description="Removes the project with all of its sprints and issues from this demo workspace." className="border-red-500/20">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Field id="confirm-delete" label={<>Type <span className="font-mono text-zinc-100">{project.key}</span> to confirm</>} className="flex-1">
          <Input id="confirm-delete" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="font-mono" />
        </Field>
        <Button
          variant="danger"
          className="h-9"
          disabled={typed.trim().toUpperCase() !== project.key}
          onClick={() => {
            router.push(href("/projects"));
            deleteProject(project.id);
          }}
        >
          <Trash2 aria-hidden className="size-3.5" /> Delete project
        </Button>
      </div>
    </Section>
  );
}
