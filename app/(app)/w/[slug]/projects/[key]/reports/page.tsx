import type { Metadata } from "next";
import { ReportsView } from "@/components/reports/reports-view";

export const metadata: Metadata = { title: "Reports" };

// Renders behind the browser-only session and workspace gates: see app/(app)/layout.tsx.
export const instant = false;

export default function ReportsViewPage() {
  return <ReportsView />;
}
