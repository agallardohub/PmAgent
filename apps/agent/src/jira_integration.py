"""Jira REST API v3 client for PmAgent.

Provides:
  - fetch_issues(jql)          → normalized Issue[]
  - update_issue(key, fields)  → bool
  - add_comment(key, body)     → bool
  - fetch_issue_changelog(key) → raw history[]
  - health_check()             → JiraHealth
"""

from __future__ import annotations

import base64
import os
from typing import Any, Dict, List, Optional, TypedDict

import httpx
from dotenv import load_dotenv

from .jira_mcp import has_jira_creds

load_dotenv()

# ──────────────────────────────────────────────────────────────────────────────
# Types
# ──────────────────────────────────────────────────────────────────────────────

class JiraHealth(TypedDict):
    url: str
    issue_count: int
    error: Optional[str]


# ──────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ──────────────────────────────────────────────────────────────────────────────

def _base_url() -> str:
    return os.getenv("JIRA_URL", "").rstrip("/")


def _auth_headers() -> Dict[str, str]:
    email = os.getenv("JIRA_EMAIL", "")
    token = os.getenv("JIRA_API_TOKEN", "").strip()
    encoded = base64.b64encode(f"{email}:{token}".encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _normalize_issue(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a raw Jira API issue into our canonical Issue shape."""
    f = raw.get("fields", {})
    key = raw.get("key", "")
    # description may be an Atlassian Document Format dict — flatten to plain text
    desc_raw = f.get("description") or ""
    description = desc_raw if isinstance(desc_raw, str) else _adf_to_text(desc_raw)
    return {
        "id": key,
        "url": f"{_base_url()}/browse/{key}",
        "summary": f.get("summary", ""),
        "description": description[:500],  # cap to avoid bloating state
        "status": (f.get("status") or {}).get("name", ""),
        "assignee": ((f.get("assignee") or {}).get("displayName") or "Unassigned"),
        "priority": (f.get("priority") or {}).get("name", ""),
        "type": (f.get("issuetype") or {}).get("name", ""),
        "updated": f.get("updated", ""),
    }


def _adf_to_text(doc: Any) -> str:
    """Recursively extract plain text from an Atlassian Document Format object."""
    if not isinstance(doc, dict):
        return ""
    texts: List[str] = []
    for node in doc.get("content", []):
        for inner in node.get("content", []):
            if inner.get("type") == "text":
                texts.append(inner.get("text", ""))
    return " ".join(texts)


# ──────────────────────────────────────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────────────────────────────────────

ISSUE_FIELDS = [
    "key", "summary", "description", "status",
    "assignee", "priority", "issuetype", "updated",
]


def fetch_issues(
    jql: str = "project = SCRUM ORDER BY updated DESC",
    max_results: int = 50,
) -> Optional[List[Dict[str, Any]]]:
    """Return normalized issues for the given JQL, or None on error."""
    if not has_jira_creds():
        return None
    try:
        resp = httpx.get(
            f"{_base_url()}/rest/api/3/search/jql",
            params={"jql": jql, "maxResults": max_results, "fields": ISSUE_FIELDS},
            headers=_auth_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        return [_normalize_issue(i) for i in resp.json().get("issues", [])]
    except Exception as exc:
        print(f"[jira] fetch_issues error: {exc}")
        return None


def update_issue(issue_key: str, fields: Dict[str, Any]) -> bool:
    """PUT field updates to a Jira issue. Returns True on success."""
    if not has_jira_creds():
        return False
    try:
        resp = httpx.put(
            f"{_base_url()}/rest/api/3/issue/{issue_key}",
            json={"fields": fields},
            headers=_auth_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        return True
    except Exception as exc:
        print(f"[jira] update_issue {issue_key} error: {exc}")
        return False


def add_comment(issue_key: str, body: str) -> bool:
    """Post a plain-text comment to a Jira issue (wrapped in ADF)."""
    if not has_jira_creds():
        return False
    payload = {
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": body}],
                }
            ],
        }
    }
    try:
        resp = httpx.post(
            f"{_base_url()}/rest/api/3/issue/{issue_key}/comment",
            json=payload,
            headers=_auth_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        return True
    except Exception as exc:
        print(f"[jira] add_comment {issue_key} error: {exc}")
        return False


def fetch_issue_changelog(issue_key: str) -> Optional[List[Dict[str, Any]]]:
    """Return the changelog histories for an issue (used for cycle-time calc)."""
    if not has_jira_creds():
        return None
    try:
        resp = httpx.get(
            f"{_base_url()}/rest/api/3/issue/{issue_key}",
            params={"expand": "changelog"},
            headers=_auth_headers(),
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json().get("changelog", {}).get("histories", [])
    except Exception as exc:
        print(f"[jira] fetch_issue_changelog {issue_key} error: {exc}")
        return None


def health_check() -> JiraHealth:
    """Return connectivity status for the configured Jira workspace."""
    health: JiraHealth = {"url": _base_url(), "issue_count": 0, "error": None}
    if not has_jira_creds():
        health["error"] = "Jira credentials missing (JIRA_URL / JIRA_EMAIL / JIRA_API_TOKEN)."
        return health
    try:
        issues = fetch_issues("project = SCRUM ORDER BY updated DESC", max_results=1)
        health["issue_count"] = len(issues) if issues else 0
    except Exception as exc:
        health["error"] = str(exc)
    return health
