import { Suspense } from "react";
import { ProjectShell, ProjectShellFallback } from "@/components/project/project-shell";
import { createSeed } from "@/lib/tracker/seed";

/** Prerender the demo projects; projects created in the browser render on demand. */
export function generateStaticParams() {
  return createSeed(0).projects.map((p) => ({ key: p.key }));
}

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ProjectLayout({ children, params }: LayoutProps<"/w/[slug]/projects/[key]">) {
  return (
    <Suspense fallback={<ProjectShellFallback />}>
      <ProjectShell params={params}>{children}</ProjectShell>
    </Suspense>
  );
}
