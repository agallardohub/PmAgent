"""MCP-Use client wrapper around the Jira MCP server.

Spawns `npx -y @atlassian/jira-mcp-server` over stdio for the duration of each
call and exposes a synchronous facade for the agent.

Auth: Jira URL, Email, and API Token via environment variables.
"""

from __future__ import annotations

import asyncio
import json
import os
import threading
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()


# --- mcp-use lazy import -------------------------------------------------

def _client_config() -> Dict[str, Any]:
    """Build the mcp-use client config for the Jira MCP server."""
    url = os.getenv("JIRA_URL", "")
    email = os.getenv("JIRA_EMAIL", "")
    token = os.getenv("JIRA_API_TOKEN", "")
    
    return {
        "mcpServers": {
            "jira": {
                "command": "npx",
                "args": ["-y", "@iflow-mcp/jira-mcp"],
                "env": {
                    "JIRA_BASE_URL": url,
                    "JIRA_USER_EMAIL": email,
                    "JIRA_API_TOKEN": token
                },
            }
        }
    }


# --- async core ----------------------------------------------------------

async def _call_tool_async(name: str, arguments: Dict[str, Any]) -> Any:
    """Open a fresh mcp-use session, call one tool, close it."""
    from mcp_use import MCPClient  # type: ignore

    client = MCPClient.from_dict(_client_config())
    try:
        session = await client.create_session("jira")
        if session is None:
            raise RuntimeError(
                "Failed to create MCP session for Jira. "
                "Check JIRA_URL, JIRA_EMAIL, and JIRA_API_TOKEN."
            )
        return await session.call_tool(name, arguments)
    finally:
        try:
            await client.close_all_sessions()
        except Exception:
            pass


def _run_sync(coro) -> Any:
    """Run an async coroutine to completion from sync code."""
    try:
        asyncio.get_running_loop()
        running = True
    except RuntimeError:
        running = False

    if not running:
        return asyncio.run(coro)

    result_holder: Dict[str, Any] = {}

    def _runner() -> None:
        loop = asyncio.new_event_loop()
        try:
            asyncio.set_event_loop(loop)
            result_holder["value"] = loop.run_until_complete(coro)
        except Exception as e:
            result_holder["error"] = e
        finally:
            loop.close()

    t = threading.Thread(target=_runner, daemon=True)
    t.start()
    t.join()
    if "error" in result_holder:
        raise result_holder["error"]
    return result_holder.get("value")


# --- response normalization ---------------------------------------------

def _extract_payload(result: Any) -> Any:
    """Normalize an MCP tool-call result."""
    if result is None:
        raise RuntimeError("Jira MCP returned no result")

    sc = getattr(result, "structuredContent", None)
    if isinstance(sc, dict) and sc:
        return sc

    content = getattr(result, "content", None)
    if not content:
        return {}

    for block in content:
        text = getattr(block, "text", None)
        if not text:
            continue
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return text

    return {}


# --- public sync facade -------------------------------------------------

def mcp_search_issues(jql: str) -> List[Dict[str, Any]]:
    """Search for Jira issues using JQL."""
    result = _run_sync(_call_tool_async("search_issues", {"searchString": jql}))
    payload = _extract_payload(result)
    if isinstance(payload, list):
        return payload
    if isinstance(payload, dict) and "issues" in payload:
        return payload["issues"]
    return []

def mcp_get_issue(issue_key: str) -> Dict[str, Any]:
    """Retrieve details for a specific Jira issue."""
    return _extract_payload(
        _run_sync(_call_tool_async("get_issue", {"issueIdOrKey": issue_key}))
    )

def mcp_update_issue(issue_key: str, fields: Dict[str, Any]) -> Dict[str, Any]:
    """Update a Jira issue."""
    return _extract_payload(
        _run_sync(_call_tool_async("update_issue", {"issueKey": issue_key, "fields": fields}))
    )

def mcp_add_comment(issue_key: str, body: str) -> Dict[str, Any]:
    """Add a comment to a Jira issue."""
    return _extract_payload(
        _run_sync(_call_tool_async("add_comment", {"issueIdOrKey": issue_key, "body": body}))
    )

def has_jira_creds() -> bool:
    """Check if Jira credentials are set."""
    return bool(os.getenv("JIRA_URL") and os.getenv("JIRA_API_TOKEN"))
