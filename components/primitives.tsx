"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "./ui";
import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-navy">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate/70">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </Card>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent = "ember",
  delta,
  spark,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: "ember" | "navy" | "honey" | "aqua";
  delta?: { pct: number | null; goodWhenUp?: boolean };
  spark?: number[];
}) {
  const accents = {
    ember: "bg-ember text-white",
    navy: "bg-navy text-honey",
    honey: "bg-honey text-navy",
    aqua: "bg-[#2EC8D9] text-navy",
  } as const;
  const sparkStroke = { ember: "#f74737", navy: "#1f2650", honey: "#d99a12", aqua: "#0ea5b5" } as const;
  const up = delta && delta.pct != null && delta.pct > 0.5;
  const down = delta && delta.pct != null && delta.pct < -0.5;
  const good = delta && delta.pct != null && (delta.goodWhenUp ?? true ? up : down);
  const sparkData = (spark ?? []).map((v, i) => ({ i, v }));
  const sparkId = `spark-${label.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate/70">{label}</p>
          <p className="mt-1 truncate text-[26px] font-extrabold tracking-tight text-navy">{value}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {delta?.pct != null && (
              <span
                className={cn(
                  "flex items-center gap-0.5 rounded-full px-1.5 py-px font-bold",
                  good ? "bg-emerald-100 text-emerald-700" : down || up ? "bg-ember/10 text-brick" : "bg-mist text-slate",
                )}
              >
                {up ? <ArrowUpRight size={12} /> : down ? <ArrowDownRight size={12} /> : <Minus size={12} />}
                {Math.abs(delta.pct).toFixed(1)}%
              </span>
            )}
            {sub && <span className="truncate text-slate/70">{sub}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl shadow-sm", accents[accent])}>
            <Icon size={19} />
          </div>
        </div>
      </div>
      {sparkData.length > 1 && (
        <div className="-mx-1 -mb-1 mt-2 h-11">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={sparkId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkStroke[accent]} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={sparkStroke[accent]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkStroke[accent]} strokeWidth={2} fill={`url(#${sparkId})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-navy/10", className)} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-px bg-mist/60 p-0">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-2 bg-white px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn("h-4", c === 0 ? "w-24" : "flex-1")} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function Pagination({
  offset,
  limit,
  total,
  hasMore,
  onPrev,
  onNext,
}: {
  offset: number;
  limit: number;
  total?: number | null;
  hasMore: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between text-[13px]">
      <p className="text-slate/70">
        Showing <span className="font-bold text-navy">{offset + 1}–{offset + limit}</span>
        {total != null && (
          <> of <span className="font-bold text-navy">{total}</span></>
        )}
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={onPrev}
          disabled={offset === 0}
          className="rounded-lg border border-navy/20 bg-white px-3 py-1.5 font-semibold text-navy hover:bg-mist disabled:opacity-40 cursor-pointer"
        >
          ← Prev
        </button>
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="rounded-lg border border-navy/20 bg-white px-3 py-1.5 font-semibold text-navy hover:bg-mist disabled:opacity-40 cursor-pointer"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export function TableWrap({ children, minWidth = 900 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <Card className="overflow-x-auto p-0 slim-scroll">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </Card>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 bg-mist/95 backdrop-blur">
      <tr className="border-b border-navy/10 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("whitespace-nowrap px-3.5 py-2.5", className)}>{children}</th>;
}
