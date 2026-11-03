import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { ProjectsOverview } from "@/components/projects/projects-overview";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <PageContainer>
      <ProjectsOverview />
    </PageContainer>
  );
}
