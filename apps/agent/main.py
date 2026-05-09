"""LangGraph entry point for `langgraph dev --port 8133`.

Wires:
- A switchable runtime (Gemini Flash-Lite + deepagents | Gemini Flash-Lite + react |
  Claude Sonnet 4.6 + react) selected by `AGENT_RUNTIME`. See
  `src/runtime.py` and the README's "Switching to a different model".
- Notion-MCP-backed backend tools (always present; Notion read goes through
  the official `@notionhq/notion-mcp-server` via mcp-use)
- TimingMiddleware (per-turn wall-time logging — see `src/timing.py`)
- LeadStateMiddleware + CopilotKitMiddleware for canvas state + AG-UI

Frontend tools (`createItem`, `setItemName`, `setProjectField1`, etc.) are
declared on the React side via `useFrontendTool({ name, parameters,
handler })` in `src/app/page.tsx`. The runtime forwards those declarations
into the agent's tool list at run time, so we deliberately do NOT include
the Python `frontend_tool_stubs` here — adding them would cause Gemini to
reject the request with "Duplicate function declaration found: <name>".
The Python stubs in `agent/src/canvas.py` exist purely as documentation of
the contract the frontend is expected to honor.
"""

from __future__ import annotations

import os
from dotenv import load_dotenv
from src.jira_tools import load_jira_tools
from src.jira_integration import health_check as jira_health_check_fn
from src.runtime import build_graph
from src.prompts import build_system_prompt
from src.intelligence_cleanup import wipe_orphan_threads

# Load .env early so GEMINI_API_KEY / JIRA_URL / etc are visible.
load_dotenv()

wipe_orphan_threads()

def _format_integration_status() -> str:
    """Run the boot-time jira health check and format a status string."""
    try:
        status = jira_health_check_fn()
        if status.get("error"):
            return f"error: {status['error']}"
        return f"source=jira url={status['url']} issues={status['issue_count']}"
    except Exception as e:
        return f"error: {e}"

_AGENT_RUNTIME = os.getenv("AGENT_RUNTIME", "gemini-flash-deep")
print(f"[runtime] AGENT_RUNTIME={_AGENT_RUNTIME}", flush=True)

_gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""

backend_tools = load_jira_tools()

_integration_status = _format_integration_status()
print(f"[jira_store] {_integration_status}", flush=True)
SYSTEM_PROMPT = build_system_prompt(_integration_status)

_use_noop = (
    _AGENT_RUNTIME.startswith("gemini-")
    and (not _gemini_key or _gemini_key.startswith("stub"))
)

graph = build_graph(
    "noop" if _use_noop else _AGENT_RUNTIME,
    tools=backend_tools,
    system_prompt=SYSTEM_PROMPT,
)


def main() -> None:
    """Entry point for `uv run dev` / `python -m agent`.

    `langgraph dev` is the canonical local-dev runner — this just exists to
    satisfy the `[project.scripts] dev = "agent:main"` entry point.
    """
    import subprocess

    subprocess.run(
        ["langgraph", "dev", "--port", "8133"],
        check=True,
    )


if __name__ == "__main__":
    main()
