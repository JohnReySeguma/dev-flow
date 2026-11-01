import type { Priority, StatusCategory } from "@/lib/tracker/types";

export type GroupBy = "status" | "priority";

export type DisplayOptions = {
  tags: boolean;
  git: boolean;
  dates: boolean;
  compact: boolean;
};

export type Filters = {
  query: string;
  assignees: string[];
  priorities: Priority[];
  mine: boolean;
};

/** A board column: a workflow status, or a priority when grouping by priority. */
export type Lane = {
  key: string;
  label: string;
  /** Present for workflow-status lanes. */
  category?: StatusCategory;
};
