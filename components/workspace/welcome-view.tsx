"use client";

import { ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageHeader, Section } from "@/components/ui/section";
import { ROLES } from "@/lib/account-data";
import { isApiMode } from "@/lib/api/config";
import { useSession } from "@/lib/api/session";
import { DEMO_WORKSPACE_SLUG, workspacePath } from "@/lib/workspace-route";
import { CreateWorkspaceForm } from "./create-workspace";

/**
 * Shown when the account belongs to no workspace (it left, or was removed from, all of them): create one.
 * Reached with workspaces too, it lists them. Demo mode has its one workspace, so it goes straight there.
 */
export function WelcomeView() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isApiMode()) router.replace(workspacePath(DEMO_WORKSPACE_SLUG));
  }, [router]);

  if (session.status !== "signed-in") return null;
  const { workspaces, user } = session;

  return (
    <>
      <PageHeader
        title={workspaces.length ? "Your workspaces" : "Create your first workspace"}
        description={
          workspaces.length
            ? "Open a workspace, or create another one for a new team."
            : "You're not in any workspace yet. Create one to start planning, or ask a teammate to invite you to theirs."
        }
      />

      {workspaces.length > 0 && (
        <ul className="flex flex-col gap-2">
          {workspaces.map((w) => (
            <li key={w.id}>
              <Link
                href={workspacePath(w.slug)}
                className="group flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 outline-none transition-colors hover:border-line-strong hover:bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                <LayoutGrid aria-hidden className="size-4 text-zinc-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-zinc-100">{w.name}</span>
                  <span className="block text-[12px] text-zinc-500">
                    {ROLES.find((r) => r.id === w.role)?.label ?? w.role}
                    {w.isDemo && " · Shared demo"}
                  </span>
                </span>
                <ArrowRight aria-hidden className="size-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {user.isDemo ? (
        <Section title="Create a workspace" description="The shared demo account can't create workspaces. Sign up for your own account to get one.">
          <Link href="/signup" className="text-[13px] font-medium text-brand-hover hover:text-white">
            Create your own account →
          </Link>
        </Section>
      ) : (
        <Section title={workspaces.length ? "Create another workspace" : "New workspace"} description="You'll be its admin and can invite your team.">
          <CreateWorkspaceForm submitLabel={workspaces.length ? "Create workspace" : "Create my workspace"} />
        </Section>
      )}
    </>
  );
}
