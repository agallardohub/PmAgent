"use client";

import { RefreshCw, Activity } from "lucide-react";
import type { SyncMeta } from "@/lib/leads/types";

interface HeaderProps {
  title: string;
  subtitle: string;
  totalLeads: number;
  visibleLeads: number;
  sync: SyncMeta;
}

export function Header({
  title,
  subtitle,
  totalLeads,
  visibleLeads,
  sync,
}: HeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 pb-5 border-b border-border/40">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-sm">
                <Activity className="size-6 text-white" />
            </div>
            <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {title}
                </h1>
                <p className="mt-0.5 text-xs font-bold text-indigo-600 uppercase tracking-widest">{subtitle}</p>
            </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/80">
        <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground/40 mb-1">Active Scope</span>
            <span className="tabular-nums">
            <span className="font-bold text-foreground text-sm">{visibleLeads}</span>
            {visibleLeads !== totalLeads ? (
                <span className="text-muted-foreground"> / {totalLeads}</span>
            ) : null}{" "}
            issues
            </span>
        </div>
        
        {sync.syncedAt ? (
          <div className="flex flex-col items-end">
             <span className="text-[10px] text-muted-foreground/40 mb-1">Last Sync</span>
             <span className="inline-flex items-center gap-1.5 font-bold text-foreground">
                <RefreshCw className="size-3 text-indigo-500" />
                {formatRelative(sync.syncedAt)}
             </span>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function formatRelative(iso: string): string {
  try {
    const ts = new Date(iso).getTime();
    if (Number.isNaN(ts)) return "synced";
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return "synced";
  }
}
