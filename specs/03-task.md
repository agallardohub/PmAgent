# Task Execution List

This document tracks the granular tasks required to fulfill the plan.

## 1. Backend: Jira Integration & Analytics Engine
- [x] Configure Jira API Token authentication.
- [x] Build `fetch_issues` to retrieve JQL queries.
- [x] Build `fetch_issue_changelog` to retrieve status transition history.
- [x] Implement Cycle Time calculation in `analytics.py`.
- [x] Implement Throughput (rolling 30 days) and E85/E90 percentiles in `analytics.py`.
- [x] Implement Monte Carlo simulation (P50, P85, P95) in `analytics.py`.

## 2. Backend: Agent & State Management
- [x] Extend `LeadCanvasState` schema with `view` and `analytics` fields.
- [x] Implement `before_agent` hook to hydrate Jira data and analytics on boot.
- [x] Set initial state `view` to `"analytics"`.
- [x] Rewrite `prompts.py` to enforce Kanban/Vacanti methodologies.
- [x] Refactor `generate_sprint_analytics` tool to yield a `Command(update={...})` state mutation.

## 3. Frontend: State & UI
- [x] Update `AgentState` type definitions in `types.ts`.
- [x] Refactor `page.tsx` to conditionally render based on `state.view`.
- [x] Design full-canvas `AnalyticsDashboard.tsx` layout using CSS Grid.
- [x] Implement Cycle Time scatterplot using Recharts.
- [x] Implement Throughput bar chart with E85/E90 metrics.
- [x] Build the "Actionable Agile Insights" static guidance panel.
- [x] Remove empty "Welcome" states to ensure continuous data display.

## 4. Documentation
- [x] Rewrite `README.md` to reflect Team Pulse architecture.
- [x] Create comprehensive SDD Specifications (`specs/`).
- [x] Generate Spec Kit documents (Constitution, Specify, Plan, Task).
