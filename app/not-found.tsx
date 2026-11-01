import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(40%_35%_at_50%_40%,rgba(124,108,255,0.16),transparent_70%)]" />
      <Link href="/" aria-label="DevFlow home" className="mb-6 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
        <Logo />
      </Link>
      <p className="font-mono text-[13px] text-brand-hover">404</p>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">This page isn&apos;t on the board.</h1>
      <p className="max-w-sm text-[14px] text-zinc-500">The link may be broken, or the page was moved to another sprint.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link href="/" className={buttonStyles({ variant: "secondary" })}>
          Home
        </Link>
        <Link href="/projects" className={buttonStyles({ variant: "primary" })}>
          Open projects
        </Link>
      </div>
    </main>
  );
}
