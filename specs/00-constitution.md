# Constitution

## 1. Core Principles
1. **Flow Over Estimates:** The system prioritizes actual flow metrics (Cycle Time, Throughput, Aging) over deterministic estimates (Story Points, Velocity) based on Kanban University and Actionable Agile principles.
2. **Generative UI First:** The application uses AI not just to chat, but to dynamically construct and mutate the user interface (`AnalyticsDashboard`, `PipelineBoard`) based on context.
3. **Real-time Grounding:** The AI must always ground its answers in real, live Jira data. No hallucinated metrics.
4. **Resilience & Graceful Degradation:** The UI must handle missing data, API limits, or failed tool calls elegantly.

## 2. Technology Stack
*   **Frontend:** Next.js (App Router), React 18, TailwindCSS, Recharts.
*   **Intelligence Middleware:** CopilotKit (React core + Node.js BFF).
*   **Agent Backend:** Python 3.12, LangGraph, LangChain, Google Gemini 3.1 Flash-Lite.
*   **Data Source:** Atlassian Jira Cloud REST API v3.

## 3. Coding Guidelines
*   **TypeScript:** Strict typing is enforced. Interfaces for `AgentState` must mirror the Python Pydantic models.
*   **Python:** Use `typing` heavily. Tools must yield `Command(update={...})` to mutate the global state instead of returning raw strings to the chat.
*   **UI Components:** Use Tailwind for all styling. Complex data visualizations belong in dedicated components (e.g., `<AnalyticsDashboard />`).
*   **Agent Persona:** The agent ("Como Van?") is a professional Sprint Coordinator. Responses must be concise, operational, and data-driven.

## 4. Spec-Driven Development (SDD) Workflow
1. Read the **Constitution** to understand constraints.
2. Update the **Specify** document when adding new features.
3. Update the **Plan** before touching code.
4. Execute via the **Task** list.
