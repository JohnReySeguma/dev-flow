import type { ReactNode } from "react";

export type LegalSection = { id: string; title: string; body: ReactNode };

type LegalPageProps = {
  eyebrow: string;
  title: string;
  summary: ReactNode;
  updated: string;
  sections: LegalSection[];
};

/** Long-form document layout: title block, sticky table of contents, prose sections. */
export function LegalPage({ eyebrow, title, summary, updated, sections }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <header className="max-w-2xl">
        <p className="text-[13px] font-medium text-brand-hover">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">{summary}</p>
        <p className="mt-4 text-[12px] text-zinc-600">Last updated {updated}</p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">On this page</p>
          <ol className="mt-3 flex flex-col gap-1.5 border-l border-line">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-3 text-[13px] text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-200">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 max-w-2xl flex-col gap-10">
          {sections.map((s, index) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="flex items-baseline gap-3 text-lg font-semibold text-zinc-100">
                <span className="font-mono text-[12px] text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className="mt-3 flex flex-col gap-3 text-[14px] leading-relaxed text-zinc-400 [&_li]:ml-4 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-zinc-200 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
