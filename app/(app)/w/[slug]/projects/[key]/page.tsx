import { redirect } from "next/navigation";

export default async function ProjectIndexPage({ params }: PageProps<"/w/[slug]/projects/[key]">) {
  const { slug, key } = await params;
  redirect(`/w/${encodeURIComponent(slug)}/projects/${encodeURIComponent(key)}/board`);
}
