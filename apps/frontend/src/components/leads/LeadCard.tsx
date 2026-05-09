"use client";

import { motion } from "motion/react";
import { ExternalLink, Tag, User } from "lucide-react";
import type { Issue as Lead } from "@/lib/leads/types";
import {
  initials,
  priorityClass,
  typeClass,
} from "@/lib/leads/derive";
import { usePulse } from "@/lib/leads/hooks";

interface LeadCardProps {
  lead: Lead;
  selected?: boolean;
  highlighted?: boolean;
  highlightedLeadIds?: string[];
  onClick?: () => void;
  compact?: boolean;
  syncing?: boolean;
  justSynced?: boolean;
}

export function LeadCard({
  lead,
  selected,
  highlighted,
  highlightedLeadIds,
  onClick,
  compact,
  syncing,
  justSynced,
}: LeadCardProps) {
  const pulsing = usePulse(lead.id, highlightedLeadIds ?? []);
  const ring = selected
    ? "ring-2 ring-[#BEC2FF]"
    : highlighted
      ? "ring-2 ring-amber-400"
      : "ring-1 ring-border";
  
  const surface = highlighted
    ? "bg-[#BEC2FF1A] backdrop-blur-md"
    : "bg-card/80 hover:bg-[#BEC2FF1A] backdrop-blur-sm";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      layoutId={`lead-${lead.id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 380, damping: 32, mass: 0.7 }}
      className={`group relative flex w-full flex-col items-stretch gap-2.5 rounded-xl border border-border p-4 text-left shadow-lg transition ${surface} ${ring}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-[#BEC2FF] tracking-tighter">
                {lead.id}
            </span>
            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${typeClass(lead.type)}`}>
                {lead.type}
            </span>
        </div>
        <div className={`size-2 rounded-full ${lead.priority === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-muted-foreground/30'}`} />
      </div>

      <div className="min-w-0">
        <div className="text-sm font-semibold leading-tight text-foreground line-clamp-2">
          {lead.summary}
        </div>
      </div>

      {!compact ? (
        <>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 overflow-hidden">
                <Avatar name={lead.assignee} />
                <span className="truncate">{lead.assignee}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
             <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${priorityClass(lead.priority)}`}>
              {lead.priority}
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-mono">
                {new Date(lead.updated).toLocaleDateString()}
            </span>
          </div>
        </>
      ) : null}
    </motion.button>
  );
}

function Avatar({ name }: { name: string }) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return (
    <div
      className="grid size-5 shrink-0 place-items-center rounded-full text-[9px] font-bold text-white shadow-sm"
      style={{ background: `linear-gradient(135deg, hsl(${hue} 60% 60%), hsl(${hue} 60% 40%))` }}
      aria-hidden
    >
      {initials(name)}
    </div>
  );
}

export function NotionLink({ url, className }: { url?: string; className?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground ${className ?? ""}`}
    >
      view in Jira <ExternalLink className="size-3" />
    </a>
  );
}
