import { ChartNoAxesColumn, Columns3, GitPullRequest, Keyboard, type LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; body: string; detail: string }[] = [
  {
    icon: GitPullRequest,
    title: "Linked to your code",
    body: "Every card shows its pull request or commit, so the board reflects what's actually shipping.",
    detail: "DEV-104 · PR #421 open",
  },
  {
    icon: Columns3,
    title: "Your workflow, per project",
    body: "Add, rename and reorder columns. Each status counts as to do, in progress or done.",
    detail: "Triage → To Do → In Progress → QA → Released",
  },
  {
    icon: Keyboard,
    title: "Keyboard-first",
    body: "⌘K jumps to any issue. Create, assign and triage without reaching for the mouse.",
    detail: "⌘K → “104” → ↵",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Sprint reports",
    body: "Burndown while a sprint runs, velocity and say/do ratio once it closes.",
    detail: "Sprint 25 · 36 of 45 pts remaining",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-line/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-brand-hover">Built for how engineers work</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-50 sm:text-4xl">
            Your tracker should know what your repo knows.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body, detail }) => (
            // min-w-0 lets grid cells shrink below their content on narrow screens.
            <article key={title} className="group min-w-0 bg-canvas p-5 transition-colors hover:bg-surface sm:p-8">
              <span className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-brand-hover transition-colors group-hover:border-brand/40">
                <Icon aria-hidden className="size-4" />
              </span>
              <h3 className="mt-5 text-base font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{body}</p>
              <p className="mt-5 rounded-md border border-line bg-surface px-3 py-2 font-mono text-[11.5px] leading-relaxed break-words text-zinc-500">
                {detail}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
