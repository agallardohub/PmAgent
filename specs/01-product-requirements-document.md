# Product Requirements Document (PRD)

## 1. Product Vision
**PmAgent - Team Pulse** is an intelligent, AI-driven project coordination dashboard designed to bridge the gap between raw Jira issue tracking and actionable Agile/Kanban insights. It empowers Project Managers and Scrum Masters with real-time data, predictive forecasting (Monte Carlo), and automated flow analysis (Throughput, Cycle Time), drastically reducing the manual overhead of sprint tracking and bottleneck detection.

## 2. Target Audience
*   **Project Managers (PMs) / Scrum Masters:** Need to know if the sprint is on track, identify blockers, and forecast delivery dates.
*   **Engineering Managers:** Need to understand team capacity, throughput stability, and work item aging.
*   **Development Teams:** Benefit from a clear, centralized view of active priorities and immediate blockers without leaving their workflow.

## 3. Core Problems Addressed
*   **Data Overload, Insight Deficit:** Jira provides raw data but requires complex configurations to extract flow metrics (e.g., Cycle Time scatterplots, Monte Carlo simulations).
*   **Manual Status Reporting:** PMs spend hours manually checking ticket statuses and pinging developers for updates.
*   **Reactive vs. Proactive Management:** Teams often realize they will miss sprint goals too late. Lack of visibility into "aging" work-in-progress (WIP).

## 4. Key Features & Requirements

### 4.1. Real-time Jira Integration
*   **Requirement:** The system must connect directly to Jira via the Atlassian REST API using an API token.
*   **Requirement:** It must automatically hydrate the dashboard with the most recent active and completed issues (last 30 days) upon initialization.

### 4.2. Actionable Agile Analytics (Kanban)
*   **Requirement:** Calculate and display **Average Cycle Time** based on the changelog history of completed issues.
*   **Requirement:** Calculate and display **Daily Throughput** over a 30-day rolling window.
*   **Requirement:** Display Throughput Confidence Intervals (**E85 and E90**) indicating the minimum number of tasks completed per day with 85% and 90% certainty.

### 4.3. Predictive Forecasting (Monte Carlo)
*   **Requirement:** The system must run a Monte Carlo simulation (minimum 2000 iterations) using historical throughput data to forecast the completion of remaining sprint issues.
*   **Requirement:** Display P50 (Optimistic), P85 (Safe), and P95 (Conservative) completion estimates in days.

### 4.4. Conversational AI Assistant ("Como Van?")
*   **Requirement:** An embedded LangGraph-powered AI agent must be available to answer natural language queries about the sprint.
*   **Requirement:** The agent must base its analysis on Daniel Vacanti's Actionable Agile metrics and Kanban University principles (Little's Law, WIP limits, Aging).
*   **Requirement:** The agent must be able to mutate the UI (switch between Kanban Board and Analytics view) via tool calls.

## 5. Non-Functional Requirements
*   **Performance:** Analytics calculations (including Monte Carlo) must execute in under 2 seconds.
*   **Usability:** The dashboard must utilize a wide-screen, data-dense layout for charts, avoiding cramped sidebars.
*   **Resilience:** The system must gracefully handle Jira API rate limits or authentication errors, presenting clear fallback UI to the user.
