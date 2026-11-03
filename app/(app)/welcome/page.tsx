import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { WelcomeView } from "@/components/workspace/welcome-view";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return (
    <PageContainer>
      <WelcomeView />
    </PageContainer>
  );
}
