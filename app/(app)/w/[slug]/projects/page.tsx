import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectsOverview } from "@/components/projects/projects-overview";

export const metadata: Metadata = { title: "Projects" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ProjectsPage() {
  return (
    <PageContainer>
      <ProjectsOverview />
    </PageContainer>
  );
}
