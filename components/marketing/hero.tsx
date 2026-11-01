import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { BoardPreview } from "./board-preview";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Faint engineering grid, masked to fade out toward the edges. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />

      <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
        <Link
          href="/#workflow"
          className="group inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface/80 py-1 pr-3 pl-1 text-[12px] text-zinc-400 outline-none transition-colors hover:border-zinc-600 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <span className="rounded-full bg-brand-muted px-2 py-0.5 font-medium text-brand-hover">New</span>
          Backlogs, sprints &amp; custom workflows
          <ArrowRight aria-hidden className="size-3 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <h1 className="mx-auto mt-6 max-w-3xl bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-4xl font-semibold tracking-[-0.035em] text-balance text-transparent sm:text-6xl sm:leading-[1.05]">
          Ship the sprint, not the status update.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-zinc-400 sm:text-lg">
          DevFlow is a sprint-based issue tracker for engineering teams: rank the backlog, plan sprints, work a board
          shaped to your workflow, and see how each sprint really went.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/projects" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Open the live demo
            <ArrowRight aria-hidden className="size-4" />
          </Link>
          <Link href="/#workflow" className={buttonStyles({ variant: "secondary", size: "lg" })}>
            See how it works
          </Link>
        </div>
        <p className="mt-4 text-[12px] text-zinc-500">No sign-up needed · Demo data stays in your browser</p>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <BoardPreview />
      </div>
    </section>
  );
}
