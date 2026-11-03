import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Workspace settings" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function SettingsPage() {
  return (
    <PageContainer>
      <SettingsView />
    </PageContainer>
  );
}
