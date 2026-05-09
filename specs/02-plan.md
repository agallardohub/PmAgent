# Plan

## 1. Technical Architecture
The implementation relies on three interconnected layers:

### 1.1. Python Backend (LangGraph)
*   **State Schema:** Expand `LeadCanvasState` to include `view: str` and `analytics: dict`.
*   **Hydration (`before_agent`):** Upon thread creation, query Jira for the last 30 issues, run analytics engine (`analytics.py`), and inject the results into the state with `view: "analytics"`.
*   **Tools:** Refactor `generate_sprint_analytics` to return a `Command(update={...})` that mutates the global state instead of returning a markdown string to the chat history.

### 1.2. React Frontend (Next.js)
*   **State Interface:** Update `types.ts` to reflect the new `AgentState` schema.
*   **Layout Logic:** In `page.tsx`, conditionally render `<AnalyticsDashboard />` or `<PipelineBoard />` based on `state.view`.
*   **Component Design:** Redesign `AnalyticsDashboard.tsx` from a sidebar widget into a full-canvas CSS Grid layout. Add Recharts for visualizations.

### 1.3. Intelligence Middleware (CopilotKit)
*   Handle bidirectional syncing. Ensure large payloads (like arrays of Cycle Time data) do not choke the WebSocket connection.

## 2. Implementation Approach
1.  **Backend First:** Build out the Jira API integration (`jira_integration.py`) and the math engine (`analytics.py`).
2.  **State Definition:** Update Pydantic models in `lead_state.py` and TypeScript interfaces in `types.ts`.
3.  **Agent Logic:** Update `prompts.py` to enforce the Kanban persona and `jira_tools.py` to utilize state mutation.
4.  **Frontend Polish:** Build the React components. Ensure responsive design.

## 3. Data Model (Key Interfaces)
See `specs/03-data-models.md` for the exact TypeScript schemas governing `AgentState` and `AnalyticsData`.
