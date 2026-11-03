import type { Metadata } from "next";
import { SprintBoard } from "@/components/board/sprint-board";

export const metadata: Metadata = { title: "Board" };

export default function SprintBoardPage() {
  return <SprintBoard />;
}
