import { ChartNoAxesColumn, Flag, Inbox, LayoutGrid, type LucideIcon } from "lucide-react";

const STEPS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Inbox,
    title: "Capture in the backlog",
    body: "Every ticket starts in the project backlog. Rank it, estimate it in story points, assign an owner.",
  },
  {
    icon: Flag,
    title: "Plan a sprint",
    body: "Drag the top of the backlog into a sprint, give it a goal and a length, then start it.",
  },
  {
    icon: LayoutGrid,
    title: "Work the board",
    body: "The board shows only the active sprint, in your project's own workflow columns.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Complete and review",
    body: "Close the sprint, carry unfinished work forward, and read the burndown and velocity.",
  },
];

export function HowItWorks() {
  return (
    <section id="workflow" className="scroll-mt-20 border-t border-line/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-brand-hover">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-50 sm:text-4xl">
            Backlog to sprint to done, per project.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            A Scrum loop without the ceremony: each project keeps its own backlog, sprints and workflow.
          </p>
        </div>

        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} className="relative min-w-0 rounded-xl border border-line bg-surface p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-brand-hover">
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="font-mono text-[12px] text-zinc-600">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-[15px] font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
