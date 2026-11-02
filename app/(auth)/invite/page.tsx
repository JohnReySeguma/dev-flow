import type { Metadata } from "next";
import { Suspense } from "react";
import { InviteCard, InviteForm, InviteSkeleton } from "@/components/auth/invite-form";

export const metadata: Metadata = { title: "Accept invite" };

export default function InvitePage() {
  return (
    <InviteCard>
      {/* The token is URL data: the card prerenders, the invite renders once the query is known. */}
      <Suspense fallback={<InviteSkeleton />}>
        <InviteForm />
      </Suspense>
    </InviteCard>
  );
}
