"""LeadStateMiddleware — declares the lead-triage canvas fields on the
agent's TypedDict state schema so they survive STATE_SNAPSHOT round-trips,
and hydrates a fresh thread's canvas from the canonical lead store on the
first turn.

Without the schema declaration the agent's state would only contain
``messages``, ``jump_to``, ``structured_response``, ``copilotkit``. When the
agent emits ``STATE_SNAPSHOT`` to the frontend, the snapshot replaces the
frontend's local ``agent.state``, wiping any keys (``leads``, ``header``,
``view``, ``segments``, …) the React handlers wrote via ``agent.setState``.

By declaring those keys here, LangGraph carries them through state-event
emission so the frontend's canvas state survives reloads of the run loop.

Hydration on a fresh thread:
- Each LangGraph thread is its own state slot. Without hydration, "+ new
  thread" gives the user an empty canvas even though the canonical lead
  store (Notion or local JSON) has 50 rows ready to go.
- ``before_agent`` runs once per turn, before the model fires. If
  ``state.leads`` is empty AND the lead store has rows, we return an
  update that pre-populates leads / view / header / sync — same shape
  ``fetch_notion_leads`` would write — so the canvas paints immediately
  instead of after the user explicitly imports.
- The check is "state.leads is empty", so within a thread that already
  imported, we never re-hydrate (and never overwrite user edits).

Field shapes mirror the TypeScript ``AgentState`` in
``src/lib/leads/types.ts``.
"""

from __future__ import annotations

from typing import Annotated, Any, Dict, Optional

from langchain.agents.middleware.types import AgentMiddleware, AgentState
from typing_extensions import NotRequired, TypedDict


class _Header(TypedDict, total=False):
    title: str
    subtitle: str


class _SyncMeta(TypedDict, total=False):
    databaseId: str
    databaseTitle: str
    syncedAt: Optional[str]


class _LeadFilter(TypedDict, total=False):
    workshops: list[str]
    technical_levels: list[str]
    tools: list[str]
    opt_in: str
    search: str


class _JiraIssue(TypedDict, total=False):
    id: str
    url: str
    summary: str
    description: str
    status: str
    assignee: str
    priority: str
    type: str
    updated: str


def _replace(_left: Any, right: Any) -> Any:
    """LangGraph reducer that always takes the most recent value.

    Without an explicit reducer, LangGraph would either default to
    last-write-wins for scalars or raise on conflicting types.
    """
    return right


class LeadCanvasState(AgentState):
    """Extended agent state for the Team Pulse canvas.

    Each field is `NotRequired` so the agent can boot without all fields
    set; the frontend's `mergeState` provides defaults on the React side.
    """

    leads: NotRequired[Annotated[list[_JiraIssue], _replace]]
    highlightedIssueIds: NotRequired[Annotated[list[str], _replace]]
    selectedIssueId: NotRequired[Annotated[Optional[str], _replace]]
    header: NotRequired[Annotated[_Header, _replace]]
    sync: NotRequired[Annotated[_SyncMeta, _replace]]
    view: NotRequired[Annotated[str, _replace]]
    analytics: NotRequired[Annotated[Dict[str, Any], _replace]]


class LeadStateMiddleware(AgentMiddleware[LeadCanvasState, Any]):  # type: ignore[type-arg]
    """Contributes the lead-canvas state schema and hydrates fresh threads.

    LangGraph merges the state schemas of every middleware in the chain, so
    inserting this alongside CopilotKitMiddleware adds the lead fields to
    the graph's state. The ``before_agent`` hook then ensures a fresh
    thread starts with a populated canvas instead of an empty one — see
    the module docstring for the full rationale.
    """

    state_schema = LeadCanvasState

    def before_agent(self, state: Any, runtime: Any) -> dict[str, Any] | None:
        """Hydrates the canvas with recent issues and analytics on first turn."""
        from src.jira_integration import fetch_issues
        from src.analytics import calculate_cycle_time_stats, calculate_throughput, run_monte_carlo
        
        leads = state.get("leads", [])
        if not leads:
            # Fetch active and recently completed issues for initial view
            issues = fetch_issues('project = SCRUM AND statusCategory IN (Done, "In Progress") ORDER BY updated DESC', max_results=30)
            if issues:
                project_key = "SCRUM"
                cycle = calculate_cycle_time_stats(project_key)
                throughput = calculate_throughput(project_key, days=30)
                remaining_issues = fetch_issues(f"project = {project_key} AND statusCategory != Done", max_results=200) or []
                remaining_count = len(remaining_issues)
                history = [d["count"] for d in throughput["daily_counts"]]
                forecast = run_monte_carlo(remaining_count, history)

                analytics_data = {
                    "cycleTime": cycle,
                    "throughput": throughput,
                    "monteCarlo": forecast,
                    "remainingIssues": remaining_count,
                }

                return {
                    "leads": issues,
                    "view": "analytics",
                    "analytics": analytics_data,
                    "header": {
                        "title": "PmAgent – Team Pulse",
                        "subtitle": f"{len(issues)} issues · Initial Load",
                    }
                }
        return None
