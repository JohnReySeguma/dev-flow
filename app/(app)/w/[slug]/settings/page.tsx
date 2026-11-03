import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Workspace settings" };

export default function SettingsPage() {
  return (
    <PageContainer>
      <SettingsView />
    </PageContainer>
  );
}
