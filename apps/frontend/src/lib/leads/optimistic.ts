import type { AgentState, Issue } from "./types";

export function applyPatch(
  state: AgentState,
  issueId: string,
  patch: Partial<Issue>,
): AgentState {
  const idx = state.leads.findIndex((l) => l.id === issueId);
  if (idx < 0) return state;
  const next = state.leads.slice();
  next[idx] = { ...state.leads[idx], ...patch };
  return { ...state, leads: next };
}

export function revertPatch(state: AgentState, snapshot: Issue): AgentState {
  const idx = state.leads.findIndex((l) => l.id === snapshot.id);
  if (idx < 0) {
    return { ...state, leads: [...state.leads, snapshot] };
  }
  const next = state.leads.slice();
  next[idx] = snapshot;
  return { ...state, leads: next };
}
