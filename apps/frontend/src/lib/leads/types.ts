export type IssueStatus = "To Do" | "In Progress" | "Done" | string;

import type { AnalyticsData } from "@/components/copilot/AnalyticsDashboard";

export interface Issue {
  id: string; // Jira Key
  url: string;
  summary: string;
  description: string;
  status: string;
  assignee: string;
  priority: string;
  type: string;
  updated: string;
}

export interface IssueFilter {
  status: string[];
  assignee: string[];
  search: string;
}

export interface SyncMeta {
  databaseTitle: string;
  syncedAt: string | null;
}

export interface AgentState {
  leads: Issue[]; // Keep as 'leads' for internal compatibility with existing components for now
  filter: IssueFilter;
  highlightedIssueIds: string[];
  selectedIssueId: string | null;
  header: { title: string; subtitle: string };
  sync: SyncMeta;
  view?: "board" | "analytics";
  analytics?: AnalyticsData;
}

export interface JiraHealth {
  url: string;
  issue_count: number;
  error: string | null;
}
