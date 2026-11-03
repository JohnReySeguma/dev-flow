import { ArrowUpRight } from "lucide-react";
import { GitHubIcon } from "@/components/ui/brand-icons";

const LAYERS: { title: string; repo: { label: string; href: string }; items: { name: string; note: string }[] }[] = [
  {
    title: "Web app",
    repo: { label: "dev-flow", href: "https://github.com/JohnReySeguma/dev-flow" },
    items: [
      { name: "Next.js 16", note: "App Router, Cache Components" },
      { name: "React 19 + TypeScript", note: "strict, typed end to end" },
      { name: "Tailwind CSS 4", note: "a small in-house design system" },
      { name: "OpenAPI types", note: "generated from the API's contract" },
      { name: "Optimistic store", note: "ordered request queue, rollback on refusal" },
      { name: "Socket.IO client", note: "Live Sync and presence" },
    ],
  },
  {
    title: "API",
    repo: { label: "dev-flow-be", href: "https://github.com/JohnReySeguma/dev-flow-be" },
    items: [
      { name: "Node.js 22 + Express 5", note: "TypeScript, native ESM" },
      { name: "PostgreSQL 16 + Prisma 7", note: "workspaces, sprints, issue history" },
      { name: "Redis 7", note: "rate limits, Socket.IO fan-out" },
      { name: "Zod 4", note: "validation and the OpenAPI 3.1 spec" },
      { name: "OAuth + GitHub App", note: "GitHub and Google sign-in, signed webhooks" },
      { name: "Vitest + Supertest", note: "against a real Postgres database" },
    ],
  },
];

export function TechStack() {
  return (
    <section id="stack" className="scroll-mt-20 border-t border-line/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium text-brand-hover">Under the hood</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance text-zinc-50 sm:text-4xl">
            A real product stack, front to back.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Two repositories that meet at a versioned contract: the web app talks to the API through typed calls generated
            from its OpenAPI spec, and both release with Semantic Versioning.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {LAYERS.map(({ title, repo, items }) => (
            <div key={title} className="min-w-0 rounded-xl border border-line bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
                <a
                  href={repo.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-md text-[12.5px] text-zinc-400 outline-none hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <GitHubIcon className="size-3.5" />
                  <span className="font-mono">{repo.label}</span>
                  <ArrowUpRight aria-hidden className="size-3" />
                </a>
              </div>
              <ul className="divide-y divide-line">
                {items.map(({ name, note }) => (
                  <li key={name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-5 py-3">
                    <span className="text-[13.5px] font-medium text-zinc-200">{name}</span>
                    <span className="text-[12.5px] text-zinc-500">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
