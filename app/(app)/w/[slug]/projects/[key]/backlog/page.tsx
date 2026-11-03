import type { Metadata } from "next";
import { BacklogView } from "@/components/backlog/backlog-view";

export const metadata: Metadata = { title: "Backlog" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function BacklogViewPage() {
  return <BacklogView />;
}
