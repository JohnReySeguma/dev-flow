import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmailCard, VerifyEmailForm, VerifyEmailSkeleton } from "@/components/auth/verify-email-form";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <VerifyEmailCard>
      {/* The token is URL data: the card prerenders, the result renders once the query is known. */}
      <Suspense fallback={<VerifyEmailSkeleton />}>
        <VerifyEmailForm />
      </Suspense>
    </VerifyEmailCard>
  );
}
