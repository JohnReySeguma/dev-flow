import { Suspense } from "react";
import { ProjectShell, ProjectShellFallback } from "@/components/project/project-shell";
import { createSeed } from "@/lib/tracker/seed";

/** Prerender the demo projects; projects created in the browser render on demand. */
export function generateStaticParams() {
  return createSeed(0).projects.map((p) => ({ key: p.key }));
}

export default function ProjectLayout({ children, params }: LayoutProps<"/projects/[key]">) {
  return (
    <Suspense fallback={<ProjectShellFallback />}>
      <ProjectShell params={params}>{children}</ProjectShell>
    </Suspense>
  );
}
