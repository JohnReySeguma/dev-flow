import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { AccessTokens } from "@/components/profile/access-tokens";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = { title: "Profile" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ProfilePage() {
  return (
    <PageContainer>
      <ProfileView />
      <AccessTokens />
    </PageContainer>
  );
}
