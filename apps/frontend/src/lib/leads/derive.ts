import type { Issue, IssueFilter } from "./types";

export function applyFilter(issues: Issue[], f: IssueFilter): Issue[] {
  const search = f.search.trim().toLowerCase();
  return issues.filter((l) => {
    if (f.status.length && !f.status.includes(l.status)) return false;
    if (f.assignee.length && !f.assignee.includes(l.assignee)) return false;
    if (search.length) {
      const blob = `${l.id} ${l.summary} ${l.description} ${l.assignee}`.toLowerCase();
      if (!blob.includes(search)) return false;
    }
    return true;
  });
}

export function groupByStatus(issues: Issue[]): Record<string, Issue[]> {
  const groups: Record<string, Issue[]> = {};
  for (const l of issues) {
    (groups[l.status] ||= []).push(l);
  }
  return groups;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const PRIORITY_COLORS: Record<string, string> = {
  High: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  Medium: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  Low: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
};

export function priorityClass(priority: string): string {
  return (
    PRIORITY_COLORS[priority] ??
    "bg-muted text-muted-foreground ring-border"
  );
}

const TYPE_COLORS: Record<string, string> = {
  Bug: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  Story: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  Task: "bg-sky-500/15 text-sky-700 dark:text-sky-300 ring-sky-500/30",
};

export function typeClass(type: string): string {
  return (
    TYPE_COLORS[type] ?? "bg-muted text-muted-foreground ring-border"
  );
}

export function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("terminada") || s.includes("finalizada") || s.includes("listo") || s.includes("prod")) {
    return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30";
  }
  if (s.includes("progress") || s.includes("desarrollo") || s.includes("priority") || s.includes("en curso")) {
    return "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30";
  }
  return "bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-slate-500/30";
}
