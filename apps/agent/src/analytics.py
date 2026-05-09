"""Sprint analytics engine for PmAgent.

Provides:
  - calculate_cycle_time_stats(project_key) → avg cycle time per issue
  - calculate_throughput(project_key, days)  → daily completion counts
  - run_monte_carlo(remaining, history)       → P50/P85/P95 forecast
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any, Dict, List

from .jira_integration import fetch_issues, fetch_issue_changelog

# ──────────────────────────────────────────────────────────────────────────────
# Cycle Time
# ──────────────────────────────────────────────────────────────────────────────

_IN_PROGRESS_KEYWORDS = {"progress", "curso", "desarrollo", "en curso"}
_DONE_KEYWORDS = {"done", "terminada", "finalizada", "listo", "prod"}


def _parse_dt(s: str) -> datetime:
    return datetime.strptime(s[:19], "%Y-%m-%dT%H:%M:%S")


def _cycle_time_days(histories: List[Dict[str, Any]]) -> float | None:
    """Return cycle-time in days from a changelog history list, or None."""
    start: datetime | None = None
    end: datetime | None = None

    for item in histories:
        ts = _parse_dt(item["created"])
        for entry in item.get("items", []):
            if entry.get("field") != "status":
                continue
            to_val = (entry.get("toString") or "").lower()
            if not start and any(k in to_val for k in _IN_PROGRESS_KEYWORDS):
                start = ts
            if any(k in to_val for k in _DONE_KEYWORDS):
                end = ts

    if start and end and end > start:
        return (end - start).total_seconds() / 86_400
    return None


def calculate_cycle_time_stats(
    project_key: str = "SCRUM",
    sample: int = 15,
) -> Dict[str, Any]:
    """Return average cycle-time stats for the last N completed issues."""
    jql = f"project = {project_key} AND statusCategory = Done ORDER BY updated DESC"
    issues = fetch_issues(jql, max_results=sample) or []

    cycle_times: List[Dict[str, Any]] = []
    for issue in issues:
        histories = fetch_issue_changelog(issue["id"]) or []
        days = _cycle_time_days(histories)
        if days is not None:
            cycle_times.append({
                "key": issue["id"],
                "days": round(days, 1),
                "end_date": issue["updated"][:10],
            })

    if not cycle_times:
        return {"cycle_times": [], "average_days": 0, "count": 0, "error": "No cycle-time data available."}

    avg = sum(c["days"] for c in cycle_times) / len(cycle_times)
    return {
        "cycle_times": cycle_times,
        "average_days": round(avg, 1),
        "count": len(cycle_times),
    }


# ──────────────────────────────────────────────────────────────────────────────
# Throughput
# ──────────────────────────────────────────────────────────────────────────────

def calculate_throughput(
    project_key: str = "SCRUM",
    days: int = 30,
) -> Dict[str, Any]:
    """Return daily issue-completion counts for the past N days."""
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    jql = (
        f"project = {project_key} AND statusCategory = Done "
        f"AND updated >= '{since}' ORDER BY updated DESC"
    )
    issues = fetch_issues(jql, max_results=200) or []

    # Build daily bucket initialised to 0
    buckets: Dict[str, int] = {
        (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d"): 0
        for i in range(days)
    }
    for issue in issues:
        day = issue.get("updated", "")[:10]
        if day in buckets:
            buckets[day] += 1

    daily_counts = sorted(
        [{"date": d, "count": c} for d, c in buckets.items()],
        key=lambda x: x["date"],
    )
    avg = len(issues) / max(days, 1)
    
    counts_only = sorted(buckets.values())
    n = len(counts_only)
    # E85 confidence for throughput means 85% of the time we deliver AT LEAST this amount (15th percentile)
    e85 = counts_only[int(n * 0.15)] if n > 0 else 0
    e90 = counts_only[int(n * 0.10)] if n > 0 else 0

    return {
        "daily_counts": daily_counts,
        "average_per_day": round(avg, 2),
        "total_completed": len(issues),
        "e85": e85,
        "e90": e90,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Monte Carlo Simulation
# ──────────────────────────────────────────────────────────────────────────────

def run_monte_carlo(
    remaining_issues: int,
    throughput_history: List[int],
    simulations: int = 2000,
) -> Dict[str, Any]:
    """Forecast completion via Monte Carlo; returns P50, P85, P95 in days."""
    if not throughput_history or all(c == 0 for c in throughput_history):
        throughput_history = [1]  # Fallback: 1 issue/day

    results: List[int] = []
    for _ in range(simulations):
        done = 0
        elapsed = 0
        while done < remaining_issues:
            daily = random.choice(throughput_history)
            done += max(daily, 0)
            elapsed += 1
        results.append(elapsed)

    results.sort()
    n = len(results)
    return {
        "p50": results[int(n * 0.50)],
        "p85": results[int(n * 0.85)],
        "p95": results[int(n * 0.95)],
        "min": results[0],
        "max": results[-1],
    }
