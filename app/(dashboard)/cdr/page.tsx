"use client";

import { useCallback, useEffect, useState } from "react";
import { FileClock, Play } from "lucide-react";
import { Badge, Button, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { Pagination, SectionCard, TableSkeleton, TableWrap, Th, THead } from "@/components/primitives";
import { fetchAgentCallLogs, fetchCallHistory, fetchCdrs } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import type { Cdr } from "@/lib/types";

type Tab = "all" | "agent" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All CDRs" },
  { id: "agent", label: "Agent logs" },
  { id: "history", label: "History" },
];

export default function CdrPage() {
  const [tab, setTab] = useState<Tab>("all");
  const [rows, setRows] = useState<Cdr[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [offset, setOffset] = useState(0);
  const limit = 20;
  const [entityType, setEntityType] = useState("Lead");
  const [entityIds, setEntityIds] = useState("");
  const [serviceBoardId, setServiceBoardId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [callType, setCallType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "all") {
        const data = await fetchCdrs({ offset, limit });
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        setTotal(list.length < limit ? offset + list.length : null);
      } else if (tab === "agent") {
        if (!entityIds.trim()) {
          setError("entity_ids is required for agent call logs");
          setLoading(false);
          return;
        }
        const data = await fetchAgentCallLogs({ offset, limit, entity_type: entityType, entity_ids: entityIds });
        setRows(data.call_histories ?? []);
        setTotal(data.total_count ?? null);
      } else {
        if (!entityIds.trim()) {
          setError("entity_id is required for call-record-history");
          setLoading(false);
          return;
        }
        const payload: Record<string, unknown> = {
          entity_type: entityType,
          entity_id: entityIds.split(",")[0].trim(),
        };
        if (serviceBoardId) payload.service_board_id = Number(serviceBoardId);
        if (from && to) payload.time_range = `${new Date(from).getTime()}-${new Date(to).getTime()}`;
        if (callType) payload.call_type = callType;
        const data = await fetchCallHistory({ offset, limit, payload: JSON.stringify(payload) });
        setRows(data.call_record ?? []);
        setTotal(data.total_count ?? null);
      }
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [tab, offset, entityType, entityIds, serviceBoardId, from, to, callType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="CDR & Call History"
        subtitle="GET /cdrs · /cdrs/agent_call_logs · /cdrs/call-record-history"
        icon={FileClock}
      />

      <SectionCard
        title="Filters"
        actions={
          <div className="flex gap-1.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setOffset(0); }}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-bold cursor-pointer ${tab === t.id ? "bg-navy text-white" : "bg-mist text-slate hover:text-navy"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {tab !== "all" && (
            <>
              <div>
                <Label>Entity type</Label>
                <Select value={entityType} onChange={(e) => setEntityType(e.target.value)}>
                  <option value="Lead">Lead</option>
                  <option value="Contact">Contact</option>
                </Select>
              </div>
              <div>
                <Label>{tab === "agent" ? "Entity IDs (comma separated)" : "Entity ID"}</Label>
                <Input value={entityIds} onChange={(e) => setEntityIds(e.target.value)} placeholder="abc123" />
              </div>
            </>
          )}
          {tab === "history" && (
            <>
              <div>
                <Label>Service board ID</Label>
                <Input value={serviceBoardId} onChange={(e) => setServiceBoardId(e.target.value)} />
              </div>
              <div>
                <Label>Call type</Label>
                <Select value={callType} onChange={(e) => setCallType(e.target.value)}>
                  <option value="">Any</option>
                  <option value="incoming">Incoming</option>
                  <option value="outgoing">Outgoing</option>
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
            </>
          )}
        </div>
        <Button className="mt-3 font-bold" size="sm" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Apply filters"}
        </Button>
      </SectionCard>

      {error && <div className="mt-4"><ErrorBox message={error} /></div>}

      <div className="mt-4">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : rows.length === 0 ? (
          <EmptyState message="No records found" hint="Adjust the filters above. Agent logs and history require an entity ID." />
        ) : (
          <TableWrap minWidth={960}>
            <THead>
              <Th>Date</Th><Th>Customer</Th><Th>Agent</Th><Th>Status</Th><Th>Talk</Th><Th>Duration</Th><Th>DID</Th><Th>Recording</Th>
            </THead>
            <tbody>
              {rows.map((r, i) => {
                const connected = /answer|connect/i.test(String(r.call_status ?? ""));
                return (
                  <tr key={String(r.id ?? r.call_uuid ?? i)} className="border-b border-navy/5 last:border-0 hover:bg-mist/70">
                    <td className="whitespace-nowrap px-3.5 py-2.5 text-[13px]">{formatDateTime(r.date_time as string)}</td>
                    <td className="px-3.5 py-2.5 font-semibold text-navy">{String(r.customer ?? "—")}</td>
                    <td className="px-3.5 py-2.5">{String(r.agent ?? "—")}</td>
                    <td className="px-3.5 py-2.5">
                      <Badge tone={connected ? "green" : "zinc"}>{String(r.call_status ?? "—")}</Badge>
                    </td>
                    <td className="px-3.5 py-2.5 tabular-nums">{r.talk_time ?? "—"}</td>
                    <td className="px-3.5 py-2.5 tabular-nums">{r.total_call_duration ?? "—"}</td>
                    <td className="px-3.5 py-2.5 font-mono text-xs">{String(r.did_number ?? "—")}</td>
                    <td className="px-3.5 py-2.5">
                      {r.call_recording ? (
                        <a
                          className="inline-flex items-center gap-1 rounded-md bg-navy px-2 py-1 text-[11px] font-bold text-white hover:bg-ember"
                          href={String(r.call_recording)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Play size={11} /> Play
                        </a>
                      ) : (
                        <span className="text-slate/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </div>

      {!loading && rows.length > 0 && (
        <Pagination
          offset={offset}
          limit={limit}
          total={total}
          hasMore={rows.length >= limit}
          onPrev={() => setOffset(Math.max(0, offset - limit))}
          onNext={() => setOffset(offset + limit)}
        />
      )}
    </div>
  );
}
