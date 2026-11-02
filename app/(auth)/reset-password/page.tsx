import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordCard, ResetPasswordForm, ResetPasswordSkeleton } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <ResetPasswordCard>
      {/* The token is URL data: the card prerenders, the form renders once the query is known. */}
      <Suspense fallback={<ResetPasswordSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </ResetPasswordCard>
  );
}
