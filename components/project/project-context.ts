"use client";

import { createContext, useContext } from "react";
import type { Project } from "@/lib/tracker/types";

export type CreateIssueOptions = {
  sprintId?: string | null;
  statusId?: string;
};

type ProjectContextValue = {
  project: Project;
  /** Opens the issue detail sheet. */
  openIssue: (issueId: string) => void;
  openCreateIssue: (options?: CreateIssueOptions) => void;
};

export const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const value = useContext(ProjectContext);
  if (!value) throw new Error("useProject must be used inside a project route");
  return value;
}
