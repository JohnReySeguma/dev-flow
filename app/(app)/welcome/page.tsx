import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { WelcomeView } from "@/components/workspace/welcome-view";

export const metadata: Metadata = { title: "Welcome" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function WelcomePage() {
  return (
    <PageContainer>
      <WelcomeView />
    </PageContainer>
  );
}
