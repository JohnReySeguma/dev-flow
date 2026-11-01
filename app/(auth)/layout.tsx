import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col items-center px-4 py-10">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(124,108,255,0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_30%,black,transparent)]"
      />

      <Link href="/" aria-label="DevFlow home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
        <Logo />
      </Link>

      <main className="flex w-full flex-1 items-center justify-center py-10">{children}</main>

      <p className="max-w-sm text-center text-[12px] leading-relaxed text-zinc-600">
        By continuing you agree to the{" "}
        <a href="#" className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="#" className="text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
