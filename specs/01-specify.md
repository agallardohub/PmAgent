# Specify

## 1. Product Overview
PmAgent - Team Pulse transforms raw Jira SCRUM/Kanban data into an actionable Agile command center. It uses Generative UI to switch between a tactical issue board and a strategic analytics dashboard.

## 2. User Journeys

### 2.1. Initial Hydration (Cold Start)
*   **Trigger:** The PM opens the web app `/leads`.
*   **Action:** The LangGraph backend automatically triggers the `before_agent` hook.
*   **Result:** The system queries Jira for the last 30 active/completed issues, computes baseline analytics (Throughput, Cycle Time, Monte Carlo), and immediately renders the full `AnalyticsDashboard` without requiring a user prompt.

### 2.2. Asking for Blockers
*   **Trigger:** PM asks the agent: "Are there any blocked teams or aging tickets?"
*   **Action:** The agent reviews the `AgentState` (specifically Cycle Time outliers and Statuses). It uses the `highlight_issues` tool to visually emphasize specific cards.
*   **Result:** The UI highlights the offending tickets. The agent replies with a concise summary based on Little's Law.

### 2.3. Requesting Forecasts
*   **Trigger:** PM asks: "When will we finish the current backlog?"
*   **Action:** Agent reads the `monteCarlo` state.
*   **Result:** Agent outputs the P85 date and explains that estimating using single-point velocity is flawed, reinforcing Kanban methodology.

## 3. Core Features & Expected Results
1.  **Dashboard View Toggle:** The system seamlessly switches between `view: "board"` and `view: "analytics"` natively via React state.
2.  **E85/E90 Throughput Metrics:** The Throughput chart displays reliable confidence intervals (bottom 15% and 10% percentiles).
3.  **Actionable Agile Panel:** A persistent UI element inside the Analytics view reminding the user of flow principles (WIP Limits, Aging).
