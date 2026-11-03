import type { Metadata } from "next";
import { SprintBoard } from "@/components/board/sprint-board";

export const metadata: Metadata = { title: "Board" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function SprintBoardPage() {
  return <SprintBoard />;
}
