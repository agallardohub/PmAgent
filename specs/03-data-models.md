# Data Models Specification

## 1. Global Agent State (`LeadCanvasState` / `AgentState`)

This is the central payload synchronized between Python (LangGraph) and TypeScript (React) via the CopilotKit protocol.

```typescript
export interface AgentState {
  leads: Issue[];                 // The list of active/completed Jira issues
  filter: IssueFilter;            // Local UI state for filtering the board
  highlightedIssueIds: string[];  // IDs highlighted by the AI
  selectedIssueId: string | null; // ID selected by user for details panel
  header: {                       // Dynamic header text set by the AI
    title: string; 
    subtitle: string;
  };
  sync: SyncMeta;                 // Metadata about the last Jira sync
  view?: "board" | "analytics";   // Layout directive for the main canvas
  analytics?: AnalyticsData;      // Flow metric payloads
}
```

## 2. Issue Entity (`Issue` / `_JiraIssue`)

The normalized representation of a Jira ticket used throughout the UI.

```typescript
export interface Issue {
  id: string;          // e.g. "SCRUM-42"
  url: string;         // Web URL to the Jira ticket
  summary: string;     // Ticket title
  description: string; // Markdown formatted description
  status: string;      // Current Jira Status (e.g. "Done", "In Progress")
  assignee: string;    // Display name of the assignee
  priority: string;    // "High", "Medium", "Low", etc.
  type: string;        // "Task", "Bug", "Story"
  updated: string;     // ISO 8601 Timestamp of last update
}
```

## 3. Analytics Data Object (`AnalyticsData`)

Contains the mathematical models calculated by the backend for rendering the Analytics Dashboard.

```typescript
export interface AnalyticsData {
  cycleTime: {
    cycle_times: {
      key: string;       // Issue ID
      days: number;      // Total cycle time in days
      end_date: string;  // Date of completion
    }[];
    average_days: number;
    count: number;
    error?: string;
  };
  throughput: {
    daily_counts: {
      date: string;      // YYYY-MM-DD
      count: number;     // Issues completed on this date
    }[];
    average_per_day: number;
    total_completed: number;
    e85?: number;        // 85th percentile confidence (minimum delivered)
    e90?: number;        // 90th percentile confidence
  };
  monteCarlo: {
    p50: number;         // 50% likelihood to finish remaining backlog in N days
    p85: number;         // 85% safe estimate
    p95: number;         // 95% conservative estimate
    min: number;
    max: number;
  };
  remainingIssues: number; // Current backlog size excluding "Done"
}
```
