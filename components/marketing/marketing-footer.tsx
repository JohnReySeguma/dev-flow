import Link from "next/link";
import type { ComponentType } from "react";
import { GitHubIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/ui/brand-icons";
import { Logo } from "@/components/ui/logo";
import { SOCIAL_LINKS } from "@/lib/site";
import { ContactForm } from "./contact-form";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#workflow" },
      { label: "GitHub integration", href: "/#github" },
      { label: "For teams", href: "/#teams" },
      { label: "Tech stack", href: "/#stack" },
      { label: "Live demo", href: "/projects" },
      { label: "System status", href: "/status" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
    ],
  },
];

const SOCIALS: { label: string; href: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "GitHub", href: SOCIAL_LINKS.github, icon: GitHubIcon },
  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, icon: LinkedInIcon },
  { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: InstagramIcon },
  { label: "X", href: SOCIAL_LINKS.x, icon: XIcon },
];

const LINK = "rounded text-[13px] text-zinc-500 outline-none transition-colors hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50";

export function MarketingFooter() {
  return (
    <footer className="border-t border-line/60">
      <section aria-labelledby="contact-title" className="border-b border-line/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-12">
          <div>
            <h2 id="contact-title" className="text-xl font-semibold tracking-tight text-zinc-50">
              Get in touch
            </h2>
            <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-zinc-500">
              Hiring, collaborating, or have feedback on DevFlow? Leave your email and I&apos;ll get back to you.
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="sm:col-span-3 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-zinc-500">
            A sprint-based issue tracker, built as a frontend portfolio project with Next.js and Tailwind CSS.
          </p>
          <ul className="mt-5 flex flex-wrap gap-2">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-lg border border-line text-zinc-500 outline-none transition-colors hover:border-line-strong hover:text-zinc-100 focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="text-[12px] font-medium tracking-wide text-zinc-300 uppercase">{column.title}</h3>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className={LINK}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line/60">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-[12px] text-zinc-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 DevFlow · A portfolio project</p>
          <Link
            href="/status"
            className="inline-flex items-center gap-2 self-start rounded-full border border-line px-3 py-1 text-zinc-400 outline-none transition-colors hover:border-line-strong hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-brand/50 sm:self-auto"
          >
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            All systems operational
          </Link>
        </div>
      </div>
    </footer>
  );
}
