import { redirect } from "next/navigation";

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default async function ProjectIndexPage({ params }: PageProps<"/w/[slug]/projects/[key]">) {
  const { slug, key } = await params;
  redirect(`/w/${encodeURIComponent(slug)}/projects/${encodeURIComponent(key)}/board`);
}
