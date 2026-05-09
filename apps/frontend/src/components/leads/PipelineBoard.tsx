"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Issue as Lead } from "@/lib/leads/types";
import { groupByStatus, statusClass } from "@/lib/leads/derive";
import { LeadCard } from "./LeadCard";

interface PipelineBoardProps {
  leads: Lead[];
  selectedLeadId: string | null;
  highlightedIssueIds: string[];
  onSelect: (id: string) => void;
  onMoveLead?: (leadId: string, fromStatus: string, toStatus: string) => void;
  syncingIds?: Set<string>;
  justSyncedIds?: Set<string>;
}

export function PipelineBoard({
  leads,
  selectedLeadId,
  highlightedIssueIds,
  onSelect,
  onMoveLead,
  syncingIds,
  justSyncedIds,
}: PipelineBoardProps) {
  const groups = groupByStatus(leads);
  const highlighted = new Set(highlightedIssueIds);
  
  // Dynamic statuses based on data, but ordered sensibly if possible
  const statuses = Object.keys(groups).sort((a, b) => {
    const order: Record<string, number> = { 
      "TO DO": 1, 
      "To Do": 1,
      "PRIORITY (TAREAS DE LA SEMANA)": 2,
      "IN PROGRESS": 3,
      "In Progress": 3,
      "DONE (TAREAS TERMINADAS)": 4,
      "Done": 4,
      "Finalizada": 5,
      "Listo": 5,
      "En Prod": 6
    };
    return (order[a] || 99) - (order[b] || 99);
  });

  const [draggingLead, setDraggingLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    const id = String(e.active.id);
    const lead = leads.find((l) => l.id === id) ?? null;
    setDraggingLead(lead);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingLead(null);
    if (!e.over || !onMoveLead) return;
    const leadId = String(e.active.id);
    const toStatus = String(e.over.id);
    const fromStatus =
      (e.active.data.current as { status?: string } | undefined)?.status ??
      leads.find((l) => l.id === leadId)?.status ??
      "To Do";
    if (fromStatus === toStatus) return;
    onMoveLead(leadId, fromStatus, toStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDraggingLead(null)}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {statuses.map((s) => {
          const list = groups[s] ?? [];
          return (
            <DroppableColumn key={s} status={s} count={list.length}>
              {list.length === 0 ? (
                <div className="grid place-items-center py-12 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40 border border-dashed border-border/40 rounded-lg">
                  no issues
                </div>
              ) : (
                <AnimatePresence mode="popLayout" initial={false}>
                  {list.map((lead) => (
                    <DraggableLeadCard
                      key={lead.id}
                      lead={lead}
                      selected={selectedLeadId === lead.id}
                      highlighted={highlighted.has(lead.id)}
                      highlightedIssueIds={highlightedIssueIds}
                      onClick={() => onSelect(lead.id)}
                      syncing={syncingIds?.has(lead.id) ?? false}
                      justSynced={justSyncedIds?.has(lead.id) ?? false}
                    />
                  ))}
                </AnimatePresence>
              )}
            </DroppableColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingLead ? (
          <div className="opacity-80 scale-105 rotate-2 cursor-grabbing shadow-2xl">
            <LeadCard lead={draggingLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({
  status,
  count,
  children,
}: {
  status: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      className={`flex flex-1 min-w-80 shrink-0 flex-col rounded-2xl border transition-all duration-300 ${
        isOver
          ? "border-[#BEC2FF] ring-4 ring-[#BEC2FF]/10 bg-[#BEC2FF]/5"
          : "border-border/40 bg-card/30 backdrop-blur-sm shadow-sm"
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/40 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ring-1 ring-inset ${statusClass(
              status,
            )}`}
          >
            {status}
          </span>
        </div>
        <span className="shrink-0 rounded-lg bg-background/50 px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums text-muted-foreground ring-1 ring-inset ring-border/20 shadow-inner">
          {count}
        </span>
      </header>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 custom-scrollbar">
        {children}
      </div>
    </section>
  );
}

interface DraggableLeadCardProps {
  lead: Lead;
  selected: boolean;
  highlighted: boolean;
  highlightedIssueIds: string[];
  onClick: () => void;
  syncing?: boolean;
  justSynced?: boolean;
}

function DraggableLeadCard({
  lead,
  selected,
  highlighted,
  highlightedIssueIds,
  onClick,
  syncing,
  justSynced,
}: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
    data: { status: lead.status },
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.3 : 1 }}
    >
      <LeadCard
        lead={lead}
        selected={selected}
        highlighted={highlighted}
        highlightedLeadIds={highlightedIssueIds}
        onClick={onClick}
        syncing={syncing}
        justSynced={justSynced}
      />
    </div>
  );
}
