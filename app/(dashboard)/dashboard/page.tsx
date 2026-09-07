"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  HeartPulse,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Timer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui";
import { ErrorBox } from "@/components/page";
import { SectionCard, StatCard, TableSkeleton } from "@/components/primitives";
import { fetchAnalytics, fetchCdrs, fetchHealth } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { Cdr, HealthResponse } from "@/lib/types";

interface TrendPoint {
  label: string;
  total: number;
  connected: number;
}

const RANGES = [
  { id: 7, label: "7D" },
  { id: 30, label: "30D" },
] as const;

/** Best-effort extraction of [{label, value}] from the analytics envelope. */
function extractSeries(data: unknown): { label: string; value: number }[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const candidates: unknown[] = [root.trends, root.series, root.data, root.points, root.values];
  for (const c of Object.values(root)) if (Array.isArray(c)) candidates.push(c);
  for (const c of candidates) {
    if (!Array.isArray(c) || c.length === 0 || typeof c[0] !== "object") continue;
    const rows = c as Record<string, unknown>[];
    const labelKey = Object.keys(rows[0]).find(
      (k) => typeof rows[0][k] === "string" && /date|day|week|month|label|period|name/i.test(k),
    );
    const valueKey = Object.keys(rows[0]).find((k) => typeof rows[0][k] === "number");
    if (labelKey && valueKey) {
      return rows.map((r) => ({ label: String(r[labelKey]).slice(0, 10), value: Number(r[valueKey]) }));
    }
  }
  return [];
}

export default function DashboardPage() {
  const partnerId = useAuthStore((s) => s.partnerId);
  const [days, setDays] = useState<7 | 30>(30);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [totals, setTotals] = useState({ total: 0, connected: 0, missed: 0, talk: 0 });
  const [recent, setRecent] = useState<Cdr[]>([]);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const t = Date.now();
        const range = `${t - days * 86400000}-${t}`;
        const trendOf = (metric: string) =>
          fetchAnalytics({
            analytics_type: "dashboard_call_trends",
            payload: JSON.stringify({ time_range: range, metric_filter: metric, trend_basis: "DAYS" }),
          });
        const [totalRes, connRes, missRes, talkRes, cdrRes, healthRes] = await Promise.allSettled([
          trendOf("total_calls"),
          trendOf("total_connected_calls"),
          trendOf("total_missed_calls"),
          trendOf("total_talk_time"),
          fetchCdrs({ offset: 0, limit: 7 }),
          fetchHealth(),
        ]);
        const val = (r: PromiseSettledResult<{ data?: unknown }>) =>
          r.status === "fulfilled" ? extractSeries((r.value as { data?: unknown })?.data) : [];
        const tS = val(totalRes as PromiseSettledResult<{ data?: unknown }>);
        const cS = val(connRes as PromiseSettledResult<{ data?: unknown }>);
        const mS = val(missRes as PromiseSettledResult<{ data?: unknown }>);
        const kS = val(talkRes as PromiseSettledResult<{ data?: unknown }>);
        const byLabel = new Map(tS.map((p) => [p.label, p.value]));
        const byConn = new Map(cS.map((p) => [p.label, p.value]));
        const labels = [...new Set([...byLabel.keys(), ...byConn.keys()])].sort();
        setTrend(labels.map((l) => ({ label: l.slice(5), total: byLabel.get(l) ?? 0, connected: byConn.get(l) ?? 0 })));
        const sum = (s: { value: number }[]) => s.reduce((a, b) => a + b.value, 0);
        setTotals({ total: sum(tS), connected: sum(cS), missed: sum(mS), talk: sum(kS) });
        if (cdrRes.status === "fulfilled") setRecent(Array.isArray(cdrRes.value) ? cdrRes.value.slice(0, 6) : []);
        if (healthRes.status === "fulfilled") setHealth(healthRes.value);
      } catch (e) {
        setError(apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [days]);

  const { deltaTotal, connectRate } = useMemo(() => {
    if (trend.length < 4) return { deltaTotal: null, connectRate: totals.total ? (totals.connected / totals.total) * 100 : 0 };
    const half = Math.floor(trend.length / 2);
    const first = trend.slice(0, half).reduce((a, p) => a + p.total, 0);
    const second = trend.slice(half).reduce((a, p) => a + p.total, 0);
    return {
      deltaTotal: first ? ((second - first) / first) * 100 : null,
      connectRate: totals.total ? (totals.connected / totals.total) * 100 : 0,
    };
  }, [trend, totals]);

  const donut = useMemo(() => {
    const other = Math.max(0, totals.total - totals.connected - totals.missed);
    return [
      { name: "Connected", value: totals.connected, color: "#1f2650" },
      { name: "Missed", value: totals.missed, color: "#f74737" },
      { name: "Other", value: other, color: "#f5b73d" },
    ].filter((d) => d.value > 0);
  }, [totals]);

  const sparkTotal = trend.map((p) => p.total);
  const sparkConn = trend.map((p) => p.connected);
  const talkHrs = totals.talk > 0 && totals.talk < 100000 ? `${(totals.talk / 3600).toFixed(1)}h` : totals.talk.toLocaleString();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div>
      {/* Title row */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate/60">{today}{partnerId ? `  ·  Partner ${partnerId}` : ""}</p>
          <h1 className="mt-0.5 text-[24px] font-extrabold tracking-tight text-navy">
            Call Activity Overview
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-white p-1 shadow-card">
            {RANGES.map((r) => (
              <button
                key={r.id}
                onClick={() => setDays(r.id)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-bold cursor-pointer ${days === r.id ? "bg-navy text-white shadow" : "text-slate hover:text-navy"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Link href="/calls" className="flex items-center gap-1.5 rounded-xl bg-ember px-4 py-2 text-sm font-bold text-white shadow-card hover:bg-ember-dark">
            <PhoneCall size={15} /> New call
          </Link>
        </div>
      </div>

      {error && <ErrorBox message={error} />}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total calls" value={loading ? "…" : totals.total.toLocaleString()} sub="vs prior period" icon={PhoneCall} accent="ember" delta={{ pct: deltaTotal }} spark={sparkTotal} />
        <StatCard label="Connected" value={loading ? "…" : totals.connected.toLocaleString()} sub={`${connectRate.toFixed(1)}% connect rate`} icon={PhoneIncoming} accent="navy" spark={sparkConn} />
        <StatCard label="Missed calls" value={loading ? "…" : totals.missed.toLocaleString()} sub="needs callback" icon={PhoneMissed} accent="honey" delta={{ pct: deltaTotal != null ? -deltaTotal : null, goodWhenUp: false }} />
        <StatCard label="Talk time" value={loading ? "…" : talkHrs} sub="cumulative" icon={Timer} accent="aqua" />
      </div>

      {/* Chart + rail */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-navy/15 bg-white p-5 shadow-card xl:col-span-2">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-navy">Call activity</h2>
              <p className="mt-0.5 text-xs text-slate/70">Total vs connected calls per day</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate"><span className="h-2.5 w-2.5 rounded-full bg-ember" /> Total</span>
              <span className="flex items-center gap-1.5 text-slate"><span className="h-2.5 w-2.5 rounded-full bg-navy" /> Connected</span>
            </div>
          </div>
          <div className="h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate/60">Loading chart…</div>
            ) : trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate/60">No activity in this range.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 5, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f74737" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#f74737" stopOpacity={0.03} />
                    </linearGradient>
                    <linearGradient id="gConn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f2650" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#1f2650" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2650" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={28} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #1f265022", fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" name="Total" stroke="#f74737" strokeWidth={2.5} fill="url(#gTotal)" />
                  <Area type="monotone" dataKey="connected" name="Connected" stroke="#1f2650" strokeWidth={2.5} fill="url(#gConn)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Outcomes donut */}
          <div className="rounded-2xl border border-navy/15 bg-white p-5 shadow-card">
            <h2 className="text-[15px] font-bold tracking-tight text-navy">Call outcomes</h2>
            <p className="mt-0.5 text-xs text-slate/70">Last {days} days</p>
            {loading || donut.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate/60">{loading ? "Loading…" : "No data"}</p>
            ) : (
              <div className="relative mx-auto h-44 w-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donut} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                      {donut.map((d) => (<Cell key={d.name} fill={d.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xl font-extrabold text-navy">{totals.total.toLocaleString()}</p>
                  <p className="text-[11px] font-semibold text-slate/60">calls</p>
                </div>
              </div>
            )}
            <div className="mt-2 space-y-1.5">
              {donut.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2 font-medium text-slate">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name}
                  </span>
                  <span className="font-bold tabular-nums text-navy">{d.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System status */}
          <div className="rounded-2xl bg-navy p-5 text-white shadow-card" style={{ backgroundImage: "linear-gradient(150deg, #2e3570, #161b3d)" }}>
            <h2 className="flex items-center gap-2 text-[15px] font-bold tracking-tight">
              <HeartPulse size={16} className="text-honey" /> System status
            </h2>
            <div className="mt-3 space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Service</span>
                <Badge tone={health?.status === "healthy" ? "green" : "amber"}>{health?.status ?? (loading ? "…" : "—")}</Badge>
              </div>
              {Object.entries(health?.checks ?? {}).slice(0, 3).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-t border-white/10 pt-2">
                  <span className="capitalize text-white/70">{k.replace(/_/g, " ")}</span>
                  <span className="font-mono text-[11px] text-honey">{(v as { status?: string })?.status ?? "—"}</span>
                </div>
              ))}
            </div>
            <Link href="/health" className="mt-3 flex items-center gap-1 text-[13px] font-bold text-honey hover:underline">
              Full health report <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <SectionCard
        title="Recent activity"
        subtitle="Latest CDR events across boards"
        className="mt-4"
        actions={<Link href="/cdr" className="flex items-center gap-1 text-[13px] font-bold text-ember hover:underline">View all <ArrowRight size={13} /></Link>}
      >
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate/60">No recent calls.</p>
        ) : (
          <div className="slim-scroll overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-navy/10 text-left text-[11px] font-bold uppercase tracking-[0.06em] text-slate">
                  <th className="px-3 py-2">Time</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Outcome</th><th className="px-3 py-2">Talk</th><th className="px-3 py-2 text-right">Recording</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => {
                  const connected = /answer|connect/i.test(String(r.call_status ?? ""));
                  return (
                    <tr key={String(r.id ?? i)} className="group border-b border-navy/5 last:border-0 hover:bg-mist/70">
                      <td className="whitespace-nowrap px-3 py-2.5 text-[13px]">{formatDateTime(r.date_time as string)}</td>
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2 font-semibold text-navy">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/10 text-[11px] font-extrabold text-navy">
                            {String(r.customer ?? "?").replace(/\D/g, "").slice(-2) || "?"}
                          </span>
                          {String(r.customer ?? "—")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{String(r.agent ?? "—")}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${connected ? "bg-emerald-100 text-emerald-700" : "bg-mist text-slate"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {String(r.call_status ?? "—")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 tabular-nums">{r.talk_time ?? "—"}</td>
                      <td className="px-3 py-2.5 text-right">
                        {r.call_recording ? (
                          <a className="font-bold text-ember opacity-0 hover:underline group-hover:opacity-100" href={String(r.call_recording)} target="_blank" rel="noreferrer">Listen →</a>
                        ) : (<span className="text-slate/40">—</span>)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
