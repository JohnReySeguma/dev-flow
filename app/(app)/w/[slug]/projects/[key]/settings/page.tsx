import type { Metadata } from "next";
import { ProjectSettings } from "@/components/project/project-settings";

export const metadata: Metadata = { title: "Project settings" };

export default function ProjectSettingsPage() {
  return <ProjectSettings />;
}
