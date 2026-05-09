import type { AgentState, IssueFilter } from "./types";

export const emptyFilter: IssueFilter = {
  status: [],
  assignee: [],
  search: "",
};

export const initialState: AgentState = {
  leads: [],
  filter: emptyFilter,
  highlightedIssueIds: [],
  selectedIssueId: null,
  header: {
    title: "PmAgent - Team Pulse",
    subtitle: "Real-time Jira Status",
  },
  sync: { databaseTitle: "", syncedAt: null },
  view: "board",
  analytics: undefined,
};

export function isFilterEmpty(f: IssueFilter): boolean {
  return (
    f.status.length === 0 &&
    f.assignee.length === 0 &&
    f.search.trim().length === 0
  );
}

export function filterCount(f: IssueFilter): number {
  let n = 0;
  if (f.status.length) n += 1;
  if (f.assignee.length) n += 1;
  if (f.search.trim().length) n += 1;
  return n;
}
