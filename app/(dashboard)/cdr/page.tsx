"use client";

import { useCallback, useEffect, useState } from "react";
import { FileClock, Play } from "lucide-react";
import { Badge, Button, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { Pagination, SectionCard, TableSkeleton, TableWrap, Th, THead } from "@/components/primitives";
import { fetchCallDetails, fetchCallHistory, fetchCdrs } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import type { Cdr } from "@/lib/types";

type Tab = "all" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All CDRs" },
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
  const [workspaceId, setWorkspaceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [callType, setCallType] = useState("");
  const [syncForm, setSyncForm] = useState({ call_id: "", call_uuid: "", vendor_config_id: "" });
  const [syncMsg, setSyncMsg] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "all") {
        const data = await fetchCdrs({ offset, limit });
        const list = Array.isArray(data) ? data : [];
        setRows(list);
        setTotal(list.length < limit ? offset + list.length : null);
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
        if (workspaceId) payload.workspace_id = Number(workspaceId);
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
  }, [tab, offset, entityType, entityIds, workspaceId, from, to, callType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <div>
      <PageHeader
        title="CDR & Call History"
        subtitle="GET /cdrs · /cdrs/call-record-history"
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
                <Label>{tab === "history" ? "Entity ID" : "Entity IDs (comma separated)"}</Label>
                <Input value={entityIds} onChange={(e) => setEntityIds(e.target.value)} placeholder="abc123" />
              </div>
            </>
          )}
          {tab === "history" && (
            <>
              <div>
                <Label>Workspace ID</Label>
                <Input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} />
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
          <EmptyState message="No records found" hint="Adjust the filters above. History requires an entity ID." />
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

      <SectionCard
        title="Vendor CDR sync (Tata / OTOBA)"
        actions={
          <Button
            size="sm"
            disabled={syncLoading || (!syncForm.call_id && !syncForm.call_uuid) || !syncForm.vendor_config_id}
            onClick={async () => {
              setError("");
              setSyncMsg("");
              setSyncLoading(true);
              try {
                const res = await fetchCallDetails({
                  vendor_config_id: syncForm.vendor_config_id,
                  ...(syncForm.call_id ? { call_id: syncForm.call_id } : {}),
                  ...(syncForm.call_uuid ? { call_uuid: syncForm.call_uuid } : {}),
                });
                setSyncMsg(JSON.stringify(res).slice(0, 600));
                await load();
              } catch (e) {
                setError(apiErrorMessage(e));
              } finally {
                setSyncLoading(false);
              }
            }}
          >
            {syncLoading ? "Syncing…" : "Sync now"}
          </Button>
        }
      >
        <p className="mb-3 text-xs text-slate-500">
          Pulls a single CDR from the vendor API via its vendor config — backend routes
          tata_tele vs otoba automatically. Use for OTOBA relay verification.
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div>
            <Label>Call ID (vendor)</Label>
            <Input value={syncForm.call_id} onChange={(e) => setSyncForm({ ...syncForm, call_id: e.target.value })} placeholder="OTOBA/Tata call id" />
          </div>
          <div>
            <Label>Call UUID (alt identifier)</Label>
            <Input value={syncForm.call_uuid} onChange={(e) => setSyncForm({ ...syncForm, call_uuid: e.target.value })} />
          </div>
          <div>
            <Label>Vendor config ID *</Label>
            <Input value={syncForm.vendor_config_id} onChange={(e) => setSyncForm({ ...syncForm, vendor_config_id: e.target.value })} placeholder="ObjectId" />
          </div>
        </div>
        {syncMsg && <p className="mt-2 break-all font-mono text-[11px] text-green-700">{syncMsg}</p>}
      </SectionCard>
    </div>
  );
}
