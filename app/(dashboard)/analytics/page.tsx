"use client";

import { useState } from "react";
import { BarChart3, Play } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button, Card, Input, Label, Select, Textarea } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { SectionCard, StatCard } from "@/components/primitives";
import { fetchAnalytics } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { AnalyticsType, TrendMetric } from "@/lib/types";

const TYPES: AnalyticsType[] = [
  "agent_call_analytics",
  "total_agent_talk_time",
  "agent_talk_time_distribution",
  "partner_service_board",
  "dashboard_call_trends",
];

const METRICS: TrendMetric[] = [
  "total_calls",
  "total_connected_calls",
  "total_unique_calls",
  "total_missed_calls",
  "lead_connected_calls",
  "agent_connected_calls",
  "lead_missed_calls",
  "agent_missed_calls",
  "total_talk_time",
  "total_call_duration",
];

function extractSeries(data: unknown): { label: string; value: number }[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  const candidates: unknown[] = [root.trends, root.series, root.data, root.points, root.values];
  for (const c of Object.values(root)) if (Array.isArray(c)) candidates.push(c);
  for (const c of candidates) {
    if (!Array.isArray(c) || c.length === 0 || typeof c[0] !== "object") continue;
    const rows = c as Record<string, unknown>[];
    const labelKey = Object.keys(rows[0]).find(
      (k) => (typeof rows[0][k] === "string" || typeof rows[0][k] === "number") && /date|day|week|month|label|period|name|agent/i.test(k),
    );
    const valueKey = Object.keys(rows[0]).find((k) => typeof rows[0][k] === "number" && k !== labelKey);
    if (labelKey && valueKey) {
      return rows.map((r) => ({ label: String(r[labelKey]).slice(0, 16), value: Number(r[valueKey]) }));
    }
  }
  return [];
}

function extractScalars(data: unknown): { label: string; value: string }[] {
  if (!data || typeof data !== "object" || Array.isArray(data)) return [];
  return Object.entries(data as Record<string, unknown>)
    .filter(([, v]) => typeof v === "number" || typeof v === "string")
    .slice(0, 8)
    .map(([k, v]) => ({ label: k.replace(/_/g, " "), value: String(v) }));
}

export default function AnalyticsPage() {
  const [analyticsType, setAnalyticsType] = useState<AnalyticsType>("dashboard_call_trends");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [agents, setAgents] = useState("");
  const [boards, setBoards] = useState("");
  const [metric, setMetric] = useState<TrendMetric>("total_calls");
  const [basis, setBasis] = useState("DAYS");
  const [raw, setRaw] = useState("");
  const [series, setSeries] = useState<{ label: string; value: number }[]>([]);
  const [scalars, setScalars] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);

  const run = async () => {
    setLoading(true);
    setError("");
    setRaw("");
    setSeries([]);
    setScalars([]);
    try {
      const payload: Record<string, unknown> = {};
      if (from && to) {
        const f = new Date(from).getTime();
        const t = new Date(to).getTime();
        if (!Number.isNaN(f) && !Number.isNaN(t)) payload.time_range = `${f}-${t}`;
      }
      if (agents.trim()) payload.agents = agents.split(",").map((s) => s.trim()).filter(Boolean);
      if (boards.trim()) payload.service_board_id = boards.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
      if (analyticsType === "dashboard_call_trends") {
        payload.metric_filter = metric;
        payload.trend_basis = basis;
      } else {
        payload.entity_type = "Lead";
      }
      const data = await fetchAnalytics({ analytics_type: analyticsType, payload: JSON.stringify(payload) });
      const inner = (data as { data?: unknown })?.data ?? data;
      setRaw(JSON.stringify(data, null, 2));
      const s = extractSeries(inner);
      if (s.length) setSeries(s);
      else setScalars(extractScalars(inner));
      setRan(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const total = series.reduce((a, b) => a + b.value, 0);
  const peak = series.length ? series.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="GET /get-analytics · ANALYTICS_TYPE + JSON PAYLOAD"
        icon={BarChart3}
        actions={
          <Button onClick={run} disabled={loading} className="font-bold">
            <Play size={15} /> {loading ? "Running…" : "Run report"}
          </Button>
        }
      />
      {error && <ErrorBox message={error} />}

      <SectionCard title="Report parameters" subtitle="Time range, scope and metric">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <Label>Analytics type</Label>
            <Select value={analyticsType} onChange={(e) => setAnalyticsType(e.target.value as AnalyticsType)}>
              {TYPES.map((t) => (<option key={t} value={t}>{t}</option>))}
            </Select>
          </div>
          <div>
            <Label>From</Label>
            <Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <Label>Agents (comma separated)</Label>
            <Input value={agents} onChange={(e) => setAgents(e.target.value)} placeholder="agent_1, agent_2" />
          </div>
          <div>
            <Label>Service board IDs (comma separated)</Label>
            <Input value={boards} onChange={(e) => setBoards(e.target.value)} placeholder="12, 34" />
          </div>
          {analyticsType === "dashboard_call_trends" && (
            <>
              <div>
                <Label>Metric</Label>
                <Select value={metric} onChange={(e) => setMetric(e.target.value as TrendMetric)}>
                  {METRICS.map((m) => (<option key={m} value={m}>{m}</option>))}
                </Select>
              </div>
              <div>
                <Label>Trend basis</Label>
                <Select value={basis} onChange={(e) => setBasis(e.target.value)}>
                  <option value="DAYS">DAYS</option>
                  <option value="WEEKS">WEEKS</option>
                  <option value="MONTHS">MONTHS</option>
                </Select>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {ran && !loading && series.length === 0 && scalars.length === 0 && !error && (
        <div className="mt-4"><EmptyState message="No rows returned" hint="Widen the time range or change the metric and run again." /></div>
      )}

      {series.length > 0 && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total" value={total.toLocaleString()} sub={`${series.length} periods`} icon={BarChart3} accent="ember" />
            <StatCard label="Average" value={(total / series.length).toFixed(1)} sub="per period" icon={BarChart3} accent="navy" />
            <StatCard label="Peak" value={peak ? peak.value.toLocaleString() : "—"} sub={peak?.label} icon={BarChart3} accent="honey" />
          </div>
          <Card className="mt-4 p-5">
            <h2 className="text-[15px] font-bold tracking-tight text-navy">{analyticsType}</h2>
            <p className="mb-2 mt-0.5 font-mono text-[11px] text-slate/70">{metric} · {basis}</p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 10, right: 5, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2650" strokeOpacity={0.08} vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #1f265022", fontSize: 12 }} />
                  <Bar dataKey="value" name="Value" radius={[6, 6, 0, 0]}>
                    {series.map((_, i) => (
                      <Cell key={i} fill={i % 2 ? "#1f2650" : "#f74737"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      {series.length === 0 && scalars.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {scalars.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} icon={BarChart3} accent="navy" />
          ))}
        </div>
      )}

      {raw && (
        <details className="mt-4">
          <summary className="cursor-pointer text-[13px] font-bold text-navy hover:text-ember">Raw response JSON</summary>
          <Card className="mt-2 p-4">
            <Textarea readOnly rows={14} value={raw} className="font-mono text-xs" />
          </Card>
        </details>
      )}
    </div>
  );
}
