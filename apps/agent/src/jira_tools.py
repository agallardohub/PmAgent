"""LangGraph tools exposed to the PmAgent.

Backend tools:
  - fetch_jira_issues        → pull issues into canvas
  - generate_sprint_analytics → cycle time + throughput + Monte Carlo
  - jira_health_check         → connectivity probe
"""

from __future__ import annotations

import json
from typing import Annotated, Any, Dict, List

from dotenv import load_dotenv
from langchain_core.messages import ToolMessage
from langchain_core.tools import InjectedToolCallId, tool
from langgraph.types import Command

from .analytics import calculate_cycle_time_stats, calculate_throughput, run_monte_carlo
from .jira_integration import fetch_issues, health_check

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# Fetch Issues
# ──────────────────────────────────────────────────────────────────────────────

@tool
def fetch_jira_issues(
    jql: Annotated[
        str,
        "JQL query string. Defaults to the SCRUM project sorted by recent updates.",
    ] = "project = SCRUM ORDER BY updated DESC",
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Fetch Jira issues and push them to the canvas."""
    try:
        issues = fetch_issues(jql)
        if issues is None:
            return Command(update={"messages": [
                ToolMessage(
                    content="❌ Failed to fetch issues. Check JIRA_URL / JIRA_EMAIL / JIRA_API_TOKEN.",
                    tool_call_id=tool_call_id,
                )
            ]})

        return Command(update={
            "leads": issues,
            "header": {
                "title": "PmAgent – Team Pulse",
                "subtitle": f"{len(issues)} issues · project SCRUM",
            },
            "messages": [ToolMessage(
                content=f"Imported {len(issues)} issues from project SCRUM.",
                tool_call_id=tool_call_id,
            )],
        })
    except Exception as exc:
        return Command(update={"messages": [
            ToolMessage(content=f"Error: {exc}", tool_call_id=tool_call_id)
        ]})


# ──────────────────────────────────────────────────────────────────────────────
# Sprint Analytics
# ──────────────────────────────────────────────────────────────────────────────

@tool
def generate_sprint_analytics(
    project_key: Annotated[str, "Jira project key to analyse (default: SCRUM)."] = "SCRUM",
    tool_call_id: Annotated[str, InjectedToolCallId] = "",
) -> Command:
    """Compute Cycle Time, Throughput, and Monte Carlo forecast for the sprint."""
    try:
        # Cycle Time
        cycle = calculate_cycle_time_stats(project_key)

        # Throughput (30 days)
        throughput = calculate_throughput(project_key, days=30)

        # Remaining work
        remaining_issues = fetch_issues(
            f"project = {project_key} AND statusCategory != Done",
            max_results=200,
        ) or []
        remaining_count = len(remaining_issues)

        # Monte Carlo
        history = [d["count"] for d in throughput["daily_counts"]]
        forecast = run_monte_carlo(remaining_count, history)

        analytics_data: Dict[str, Any] = {
            "cycleTime": cycle,
            "throughput": throughput,
            "monteCarlo": forecast,
            "remainingIssues": remaining_count,
        }

        return Command(update={
            "view": "analytics",
            "analytics": analytics_data,
            "messages": [
                ToolMessage(
                    content="Analytics generated successfully. The dashboard view has been updated.",
                    tool_call_id=tool_call_id,
                )
            ]
        })

    except Exception as exc:
        return Command(update={"messages": [
            ToolMessage(content=f"Analytics error: {exc}", tool_call_id=tool_call_id)
        ]})


# ──────────────────────────────────────────────────────────────────────────────
# Health Check
# ──────────────────────────────────────────────────────────────────────────────

@tool
def jira_health_check() -> str:
    """Return Jira connectivity status as JSON."""
    return json.dumps(health_check(), ensure_ascii=False)


# ──────────────────────────────────────────────────────────────────────────────
# Registry
# ──────────────────────────────────────────────────────────────────────────────

def load_jira_tools() -> List[Any]:
    return [fetch_jira_issues, generate_sprint_analytics, jira_health_check]


# ──────────────────────────────────────────────────────────────────────────────
# CLI helper
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys
    if "--check" in sys.argv:
        result = health_check()
        if result.get("error"):
            print(f"FAIL: {result['error']}")
            sys.exit(1)
        print(f"OK: {result['url']} — {result['issue_count']} issues")
