import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#workflow", label: "How it works" },
  { href: "/#github", label: "GitHub" },
  { href: "/#stack", label: "Stack" },
];

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-canvas/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
        <Link href="/" aria-label="DevFlow home" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand/50">
          <Logo />
        </Link>

        <nav aria-label="Marketing" className="hidden items-center gap-1 sm:flex">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-1.5 text-[13px] font-medium text-zinc-400 outline-none transition-colors hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className={buttonStyles({ variant: "ghost" })}>
            Sign In
          </Link>
          <Link href="/signup" className={buttonStyles({ variant: "primary" })}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
