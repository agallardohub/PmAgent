# API Contracts & Integration Specification

## 1. Internal Tool Contracts (LangGraph to CopilotKit)

The Python LangGraph agent executes tools which yield `Command(update={...})` payloads. These updates are intercepted by the CopilotKit middleware and broadcast to the Next.js client, merging into the React `AgentState`.

### 1.1. `fetch_jira_issues(jql: str)`
*   **Trigger:** User asks to import issues, check the board, or the system boots (hydration).
*   **Behavior:** Queries Jira. Maps the resulting JSON to the `_JiraIssue` schema.
*   **State Mutation:** 
    *   `leads`: Overwritten with the fetched issues.
    *   `header`: Updated to reflect the number of issues fetched.

### 1.2. `generate_sprint_analytics(project_key: str)`
*   **Trigger:** User asks for metrics, velocity, flow, cycle time, or throughput.
*   **Behavior:** 
    1.  Calculates Cycle Time by querying changelogs (`/rest/api/3/issue/{id}/changelog`).
    2.  Calculates Throughput over the last 30 days.
    3.  Runs a Monte Carlo simulation for the remaining backlog.
*   **State Mutation:**
    *   `view`: Hardcoded to `"analytics"`. This triggers the Next.js UI to unmount the Kanban board and mount the Analytics Dashboard.
    *   `analytics`: Injects the `AnalyticsData` object.

## 2. External API Integration (Jira REST API v3)

All external communication is localized in `apps/agent/src/jira_integration.py`.

### 2.1. Search Issues Endpoint
*   **Endpoint:** `GET /rest/api/3/search/jql`
*   **Auth:** Basic Auth (`email:token` base64 encoded)
*   **Query Parameters:**
    *   `jql`: The JQL string.
    *   `maxResults`: Pagination limit.
    *   `fields`: `key,summary,description,status,assignee,priority,issuetype,updated`
*   **Usage:** Used by `fetch_issues` to populate the board and determine remaining backlog.

### 2.2. Issue Changelog Endpoint
*   **Endpoint:** `GET /rest/api/3/issue/{issue_id}/changelog`
*   **Auth:** Basic Auth
*   **Usage:** Used by `calculate_cycle_time_stats` to track when an issue transitioned from "To Do" to an "In Progress" status, and finally to a "Done" status. Days elapsed between these timestamps form the Cycle Time metric.
