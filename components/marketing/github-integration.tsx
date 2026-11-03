import { Check, CircleCheck, GitBranch, GitMerge, GitPullRequest, Radio } from "lucide-react";

const POINTS = [
  "Mention an issue key like DEV-127 in a pull request title, branch name or commit message.",
  "The card shows the pull request (open, draft or merged) or the commit, without anyone touching the board.",
  "Merging the pull request moves the issue to Done and counts it in the sprint's burndown.",
  "Each workspace connects its own GitHub App installation, so DEV-127 in one team never moves another's.",
];

/** Static: how a pull request travels from GitHub to the board (the real flow, as tested end to end). */
export function GitHubIntegration() {
  return (
    <section id="github" className="scroll-mt-20 border-t border-line/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-brand-hover">GitHub integration</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-50 sm:text-4xl">
            Pull requests move the board for you.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Connect the DevFlow GitHub App to a workspace once. From then on, GitHub tells DevFlow what&apos;s shipping and
            the change reaches every open board live.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {POINTS.map((point) => (
              <li key={point} className="flex gap-2.5 text-[13.5px] leading-relaxed text-zinc-300">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <ol aria-label="From pull request to done" className="relative flex min-w-0 flex-col gap-4">
          <span aria-hidden className="absolute top-6 bottom-6 left-[19px] w-px bg-gradient-to-b from-violet-500/40 via-line-strong to-emerald-500/40" />

          <Step icon={<GitBranch className="size-4" />} tone="violet" label="On GitHub">
            <div className="rounded-lg border border-line bg-canvas p-3">
              <p className="flex items-center gap-1.5 text-[12px] text-zinc-500">
                <GitPullRequest aria-hidden className="size-3.5 text-emerald-400" /> Open · #1 ·{" "}
                <span className="font-mono">dev-127-retry-budget</span>
              </p>
              <p className="mt-1.5 text-[13.5px] font-medium text-zinc-100">DEV-127 Add retry budget to webhook dispatcher</p>
            </div>
          </Step>

          <Step icon={<Radio className="size-4" />} tone="brand" label="On every open board, live">
            <div className="rounded-lg border border-zinc-800 bg-elevated p-3">
              <p className="font-mono text-[11px] text-zinc-500">DEV-127</p>
              <p className="mt-1 text-[13.5px] font-medium text-zinc-100">Add retry budget to webhook dispatcher</p>
              <p className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded border border-line-strong px-1.5 py-px font-mono text-[11px] text-zinc-300">
                  <GitPullRequest aria-hidden className="size-3 text-emerald-400" /> PR #1
                </span>
                <span className="rounded bg-rose-500/10 px-1.5 py-px text-[11px] text-rose-300">webhooks</span>
              </p>
            </div>
            <p className="mt-2 text-[12px] text-zinc-500">
              <span className="text-zinc-300">DEV-127</span> linked pull request #1 (open) · via GitHub
            </p>
          </Step>

          <Step icon={<GitMerge className="size-4" />} tone="emerald" label="Merged">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] p-3 text-[13px] text-emerald-200">
              <CircleCheck aria-hidden className="size-4 shrink-0" />
              <span>
                DEV-127 moved to <span className="font-medium">Done</span>. Sprint 25: 4 of 11 issues done.
              </span>
            </div>
          </Step>
        </ol>
      </div>
    </section>
  );
}

const TONES = {
  violet: "border-violet-500/30 text-violet-300",
  brand: "border-brand/40 text-brand-hover",
  emerald: "border-emerald-500/30 text-emerald-300",
} as const;

function Step({ icon, tone, label, children }: { icon: React.ReactNode; tone: keyof typeof TONES; label: string; children: React.ReactNode }) {
  return (
    <li className="relative flex gap-4">
      <span aria-hidden className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border bg-surface ${TONES[tone]}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-line bg-surface p-4">
        <p className="mb-2.5 text-[11px] font-medium tracking-wide text-zinc-500 uppercase">{label}</p>
        {children}
      </div>
    </li>
  );
}
