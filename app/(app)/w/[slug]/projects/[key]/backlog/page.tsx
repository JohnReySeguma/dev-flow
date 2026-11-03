import type { Metadata } from "next";
import { BacklogView } from "@/components/backlog/backlog-view";

export const metadata: Metadata = { title: "Backlog" };

export default function BacklogViewPage() {
  return <BacklogView />;
}
