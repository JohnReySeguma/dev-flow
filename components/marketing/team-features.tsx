import { KeyRound, Layers, MessageSquare, MousePointerClick, Radio, UserPlus, type LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Layers,
    title: "Workspaces",
    body: "One account, many teams. Switch workspaces from the sidebar; each keeps its own projects, members and URL.",
  },
  {
    icon: UserPlus,
    title: "Roles and invites",
    body: "Admins, members and viewers. Invite by email; people who already have an account join with one click.",
  },
  {
    icon: Radio,
    title: "Live Sync",
    body: "Teammates' changes appear as they happen, and the project header shows who has it open right now.",
  },
  {
    icon: MessageSquare,
    title: "Comments",
    body: "Discuss an issue where it lives, with every comment's author and time in the issue panel.",
  },
  {
    icon: KeyRound,
    title: "Access tokens",
    body: "Personal tokens for scripts and the CLI, each scoped to one workspace and shown only once.",
  },
  {
    icon: MousePointerClick,
    title: "Try it without an account",
    body: "Demo mode runs the whole tracker in your browser on sample data. Nothing is sent anywhere.",
  },
];

export function TeamFeatures() {
  return (
    <section id="teams" className="scroll-mt-20 border-t border-line/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-brand-hover">Built for teams</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-50 sm:text-4xl">
            Everyone on the same board, at the same time.
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="min-w-0 rounded-xl border border-line bg-surface p-5">
              <span className="flex size-9 items-center justify-center rounded-lg border border-line-strong bg-elevated text-brand-hover">
                <Icon aria-hidden className="size-4" />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold text-zinc-100">{title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
