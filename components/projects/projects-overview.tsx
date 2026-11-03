"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { describedBy, Field, Input, Textarea } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/section";
import { usePermissions } from "@/lib/api/permissions";
import { useTeam } from "@/lib/tracker/team";
import { activeSprint, backlogIssues, progressOf, sprintIssues } from "@/lib/tracker/selectors";
import { createProject, useTracker } from "@/lib/tracker/store";
import type { Project, TrackerState } from "@/lib/tracker/types";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";
import { useWorkspaceRoute } from "@/components/workspace/workspace-context";

const DAY = 86_400_000;

export function ProjectsOverview() {
  const state = useTracker();
  const [creating, setCreating] = useState(false);
  const { canWrite } = usePermissions();

  return (
    <>
      <PageHeader
        title="Projects"
        description="Each project has its own backlog, sprints and board workflow."
        actions={
          canWrite && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus aria-hidden className="size-3.5" /> New project
            </Button>
          )
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        {state.projects.map((project) => (
          <ProjectCard key={project.id} project={project} state={state} />
        ))}
      </div>
      <NewProjectDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function ProjectCard({ project, state }: { project: Project; state: TrackerState }) {
  const { href } = useWorkspaceRoute();
  const now = useNow();
  const sprint = activeSprint(state, project.id);
  const progress = sprint ? progressOf(project, sprintIssues(state, sprint.id)) : null;
  const pct = progress?.totalPoints ? Math.round((progress.donePoints / progress.totalPoints) * 100) : 0;
  const daysLeft = sprint?.endAt ? Math.ceil((Date.parse(sprint.endAt) - now) / DAY) : null;
  const { byId } = useTeam();
  const lead = byId[project.leadId];
  const backlog = backlogIssues(state, project.id).length;

  return (
    <Link
      href={href(`/projects/${project.key}/${sprint ? "board" : "backlog"}`)}
      className="group flex min-w-0 flex-col rounded-xl border border-line bg-surface p-5 outline-none transition-colors hover:border-line-strong hover:bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50"
    >
      <div className="flex items-start gap-3">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br font-mono text-sm font-bold text-white", project.color)}>
          {project.key[0]}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            <span className="truncate">{project.name}</span>
            <span className="rounded border border-line-strong bg-raised px-1 font-mono text-[10px] font-medium text-zinc-400">{project.key}</span>
          </h2>
          <p className="mt-1 line-clamp-2 text-[13px] text-zinc-500">{project.description || "No description."}</p>
        </div>
        <ArrowRight aria-hidden className="size-4 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-300" />
      </div>

      <div className="mt-5 rounded-lg border border-line bg-canvas/50 p-3">
        {sprint && progress ? (
          <>
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-medium text-zinc-200">{sprint.name}</span>
              <span className={cn("tabular-nums", daysLeft !== null && daysLeft < 0 ? "text-red-400" : "text-zinc-500")}>
                {daysLeft === null ? "" : daysLeft < 0 ? `${-daysLeft}d overdue` : `${daysLeft}d left`}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-raised">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[11.5px] text-zinc-500 tabular-nums">
              {progress.donePoints} of {progress.totalPoints} points · {progress.doneIssues}/{progress.totalIssues} issues done
            </p>
          </>
        ) : (
          <p className="text-[12px] text-zinc-500">No active sprint — open the backlog to plan one.</p>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[12px] text-zinc-500">
        {lead && <Avatar member={lead} size="xs" />}
        <span className="truncate">Lead: {lead?.name ?? "—"}</span>
        <span className="ml-auto shrink-0">{backlog} in backlog</span>
      </div>
    </Link>
  );
}

/** "Billing Service" → "BS"; one word → its first three letters. */
function suggestKey(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const raw = words.length > 1 ? words.map((w) => w[0]).join("") : (words[0] ?? "").slice(0, 3);
  return raw.replace(/[^a-z]/gi, "").toUpperCase().slice(0, 5);
}

function NewProjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title="New project" description="Starts with an empty backlog and the default To Do → Done workflow.">
      {open && <NewProjectForm onClose={onClose} />}
    </Dialog>
  );
}

function NewProjectForm({ onClose }: { onClose: () => void }) {
  const { href } = useWorkspaceRoute();
  const { projects } = useTracker();
  const router = useRouter();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [keyEdited, setKeyEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const effectiveKey = keyEdited ? key : suggestKey(name);
  const nameError = submitted && !name.trim() ? "Name your project." : undefined;
  const keyError = !submitted
    ? undefined
    : !/^[A-Z]{2,5}$/.test(effectiveKey)
      ? "Use 2–5 letters."
      : projects.some((p) => p.key === effectiveKey)
        ? `${effectiveKey} is already taken.`
        : undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const valid = name.trim() && /^[A-Z]{2,5}$/.test(effectiveKey) && !projects.some((p) => p.key === effectiveKey);
    if (!valid) return;
    createProject({ name: name.trim(), key: effectiveKey, description: description.trim() });
    onClose();
    router.push(href(`/projects/${effectiveKey}/backlog`));
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <Field id="np-name" label="Name" error={nameError}>
          <Input id="np-name" autoFocus value={name} maxLength={40} placeholder="e.g. Developer Portal" onChange={(e) => setName(e.target.value)} {...describedBy("np-name", { error: nameError })} />
        </Field>
        <Field id="np-key" label="Key" error={keyError}>
          <Input
            id="np-key"
            value={effectiveKey}
            maxLength={5}
            className="font-mono uppercase"
            onChange={(e) => {
              setKeyEdited(true);
              setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
            }}
            {...describedBy("np-key", { error: keyError })}
          />
        </Field>
      </div>
      <p className="-mt-2 text-[12px] text-zinc-500">
        Issues will be numbered <span className="font-mono text-zinc-300">{effectiveKey || "KEY"}-1</span>,{" "}
        <span className="font-mono text-zinc-300">{effectiveKey || "KEY"}-2</span>, …
      </p>
      <Field id="np-description" label="Description">
        <Textarea id="np-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="-mx-5 -mb-4 mt-2 flex justify-end gap-2 border-t border-line bg-canvas/40 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Create project
        </Button>
      </div>
    </form>
  );
}
