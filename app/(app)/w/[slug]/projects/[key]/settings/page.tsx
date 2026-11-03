import type { Metadata } from "next";
import { ProjectSettings } from "@/components/project/project-settings";

export const metadata: Metadata = { title: "Project settings" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ProjectSettingsPage() {
  return <ProjectSettings />;
}
