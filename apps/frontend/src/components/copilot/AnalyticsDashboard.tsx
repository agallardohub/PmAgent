"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Clock, Zap, Activity } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CycleTimeItem {
  key: string;
  days: number;
  end_date: string;
}

interface DailyCount {
  date: string;
  count: number;
}

interface MonteCarloResult {
  p50: number;
  p85: number;
  p95: number;
  min: number;
  max: number;
}

export interface AnalyticsData {
  cycleTime: {
    cycle_times: CycleTimeItem[];
    average_days: number;
    count: number;
    error?: string;
  };
  throughput: {
    daily_counts: DailyCount[];
    average_per_day: number;
    total_completed: number;
    e85?: number;
    e90?: number;
  };
  monteCarlo: MonteCarloResult;
  remainingIssues: number;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  unit,
  color = "indigo",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit?: string;
  color?: "indigo" | "emerald" | "amber";
}) {
  const colorMap = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-1 ${colorMap[color]}`}>
      <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span className="text-2xl font-black text-slate-900">
        {value}
        {unit && <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
      {children}
    </h4>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  if (!data || !data.cycleTime || !data.throughput || !data.monteCarlo) {
    return (
      <div className="my-3 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="rounded-xl bg-slate-200 p-4 w-10 h-10" />
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-slate-200 rounded w-40" />
            <div className="h-2 bg-slate-200 rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="h-20 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-36 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  const { cycleTime, throughput, monteCarlo, remainingIssues } = data;
  const tooltipStyle = {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 10px 30px -5px rgba(0,0,0,0.12)",
    fontSize: "12px",
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-xl bg-indigo-600 p-3 shadow-md">
          <TrendingUp className="size-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Team Analytics & Flow Metrics
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Based on {cycleTime.count} completed issues · {remainingIssues} remaining to forecast
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Left Column (Charts) */}
        <div className="lg:col-span-2 flex flex-col gap-8 overflow-y-auto pr-2 pb-8">
          {/* Cycle Time Chart */}
          {!cycleTime.error && cycleTime.cycle_times.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <SectionTitle>Cycle Time Scatter (days)</SectionTitle>
              <div className="h-64 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cycleTime.cycle_times} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="key" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis fontSize={11} width={32} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} days`, "Cycle Time"]} cursor={{fill: 'transparent'}} />
                    <ReferenceLine
                      y={cycleTime.average_days}
                      stroke="#6366f1"
                      strokeDasharray="4 4"
                      label={{ value: "Average", position: 'insideTopLeft', fontSize: 11, fill: "#6366f1", dy: -10 }}
                    />
                    <Bar dataKey="days" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          {cycleTime.error && (
            <p className="text-sm text-slate-400 italic bg-white p-5 rounded-2xl border">{cycleTime.error}</p>
          )}

          {/* Throughput Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <SectionTitle>Daily Throughput — Last 30 Days</SectionTitle>
            <div className="h-64 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughput.daily_counts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" hide />
                  <YAxis allowDecimals={false} fontSize={11} width={28} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [v, "Issues Completed"]} />
                  <ReferenceLine
                    y={throughput.average_per_day}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    label={{ value: "Average", position: 'insideTopLeft', fontSize: 11, fill: "#10b981", dy: -10 }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column (KPIs & Forecast) */}
        <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Clock className="size-4" />}
              label="Avg Cycle Time"
              value={cycleTime.error ? "N/A" : cycleTime.average_days}
              unit={cycleTime.error ? "" : "days"}
              color="indigo"
            />
            <div className="flex flex-col gap-2">
              <StatCard
                icon={<Zap className="size-4" />}
                label="Throughput"
                value={throughput.average_per_day}
                unit="tasks/d"
                color="emerald"
              />
              <div className="flex gap-2 justify-between">
                <div className="flex-1 bg-emerald-50 rounded-lg p-2 border border-emerald-100 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">85% Conf.</span>
                  <span className="text-sm font-black text-emerald-900">{throughput.e85 ?? 0} <span className="text-[9px] font-normal">t/d</span></span>
                </div>
                <div className="flex-1 bg-emerald-50 rounded-lg p-2 border border-emerald-100 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">90% Conf.</span>
                  <span className="text-sm font-black text-emerald-900">{throughput.e90 ?? 0} <span className="text-[9px] font-normal">t/d</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Monte Carlo */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="size-5 text-indigo-600" />
              <h4 className="text-base font-bold text-indigo-900">Monte Carlo Forecast</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              To complete the remaining{" "}
              <span className="font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">{remainingIssues} issues</span>, 
              at the historical throughput distribution:
            </p>
            <div className="flex flex-col gap-3">
              {[
                { label: "50% Probability (Optimistic)", value: monteCarlo.p50, accent: false },
                { label: "85% Probability (Safe)", value: monteCarlo.p85, accent: true },
                { label: "95% Probability (Conservative)", value: monteCarlo.p95, accent: false },
              ].map(({ label, value, accent }) => (
                <div key={label} className={`flex items-center justify-between p-3 rounded-xl border ${accent ? 'border-indigo-300 bg-indigo-100/50' : 'border-slate-100 bg-slate-50'}`}>
                  <span className={`text-xs font-bold uppercase tracking-wide ${accent ? 'text-indigo-800' : 'text-slate-500'}`}>
                    {label}
                  </span>
                  <span className={`text-xl font-black ${accent ? "text-indigo-700" : "text-slate-700"}`}>
                    {value} <span className="text-sm font-normal text-slate-500">days</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kanban / Flow Recommendations */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
              <Zap className="size-4 text-amber-600" />
              Actionable Agile Insights
            </h4>
            <div className="space-y-4">
              <p className="text-xs text-amber-800/80 leading-relaxed">
                Based on Daniel Vacanti's Actionable Agile metrics and Kanban University principles:
              </p>
              <ul className="text-sm text-amber-900 space-y-3">
                <li className="flex gap-2">
                  <span className="font-bold shrink-0">•</span>
                  <span><strong>Limit WIP:</strong> Reducing active work items is the most reliable way to decrease your average cycle time of {cycleTime.average_days} days (Little's Law).</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold shrink-0">•</span>
                  <span><strong>Manage Aging:</strong> Review the Cycle Time scatter plot for outliers. Any active item approaching or exceeding {cycleTime.average_days} days needs immediate attention to prevent unpredictable delays.</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold shrink-0">•</span>
                  <span><strong>Focus on Flow, not Estimates:</strong> Your Monte Carlo forecast (85% safe in {monteCarlo.p85} days) relies on a stable system. Ensure items are right-sized and blockers are resolved daily to maintain your throughput of {throughput.average_per_day} tasks/d.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
