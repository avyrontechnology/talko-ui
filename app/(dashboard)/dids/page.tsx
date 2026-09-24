"use client";

import { useEffect, useState } from "react";
import { ListOrdered } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { TableSkeleton } from "@/components/primitives";
import {
  assignAiAgentDid,
  assignDids,
  fetchAiAvailableDids,
  fetchDidList,
  fetchDidsByWorkspace,
  fetchPoolUtilization,
  importExternalDids,
  mapExternalInternalDid,
  provisionInternalDid,
  releaseAiAgentDid,
  unassignDids,
  updateDidStatus,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { DidRecord } from "@/lib/types";

export default function DidsPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [rows, setRows] = useState<DidRecord[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [didLayer, setDidLayer] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [didFilter, setDidFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [assignJson, setAssignJson] = useState('{"dids_for_workspace": []}');
  const [pool, setPool] = useState<{ did_layer: string; status: string; count: number }[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [importForm, setImportForm] = useState({ vendor_id: "", vendor_config_id: "", did_numbers: "", display_name: "" });
  const [provisionForm, setProvisionForm] = useState({ parent_did_number: "", partner_id: defaultPartner ?? "", workspace_id: "", agent_id: "" });
  const [mapForm, setMapForm] = useState({ external_did_number: "", internal_did_number: "", partner_id: defaultPartner ?? "" });
  const [aiForm, setAiForm] = useState({ partner_id: defaultPartner, agent_bot_id: "", did_number: "" });
  const [aiDids, setAiDids] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAiDids = async () => {
    const pid = aiForm.partner_id || defaultPartner;
    if (!pid) return;
    setAiLoading(true);
    try {
      const data = await fetchAiAvailableDids(pid);
      const list = (data as { dids?: unknown })?.dids;
      setAiDids(Array.isArray(list) ? list.map(String) : []);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setAiLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (status) params.status = status;
      if (didLayer) params.did_layer = didLayer;
      if (workspaceId) params.workspace_id = workspaceId;
      if (didFilter) params.did_number = didFilter;
      const data = await fetchDidList(params);
      setRows(data.dids ?? []);
      setTotal(data.total ?? null);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const loadPool = async () => {
    setPoolLoading(true);
    try {
      const data = await fetchPoolUtilization();
      setPool(data.utilization ?? []);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setPoolLoading(false);
    }
  };

  const toggle = (did: string) =>
    setSelected((s) => (s.includes(did) ? s.filter((d) => d !== did) : [...s, did]));

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setError("");
    setMsg("");
    try {
      await fn();
      setMsg(ok);
      setSelected([]);
      await load();
      await loadAiDids();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  useEffect(() => {
    // Initial load: normal-DID inventory + AI-agent DIDs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    loadAiDids();
    loadPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader
        title="DIDs"
        subtitle="Inventory, assignment, status transitions and AI-agent binding"
        icon={ListOrdered}
        actions={<Button size="sm" onClick={load} disabled={loading}>{loading ? "Loading…" : "Search"}</Button>}
      />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      {msg && <Card className="mb-3 border-green-200 bg-green-50 p-3 text-sm text-green-700">{msg}</Card>}

      <Card className="mb-3 p-4">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <div><Label>Status</Label><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any</option><option value="available">available</option><option value="mapped">mapped</option><option value="cooling_period">cooling_period</option><option value="cooldown_completed">cooldown_completed</option></Select></div>
          <div><Label>Layer</Label><Select value={didLayer} onChange={(e) => setDidLayer(e.target.value)}><option value="">Any</option><option value="external">external</option><option value="internal">internal</option></Select></div>
          <div><Label>Workspace ID</Label><Input value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} /></div>
          <div><Label>DID number</Label><Input value={didFilter} onChange={(e) => setDidFilter(e.target.value)} /></div>
          <div className="flex items-end gap-2">
            <Button size="sm" variant="outline" onClick={() => workspaceId && act(() => fetchDidsByWorkspace(workspaceId), "Loaded workspace DIDs — see response in table refresh")}>By workspace</Button>
            <Button size="sm" variant="outline" onClick={() => act(async () => { const d = await fetchAiAvailableDids(aiForm.partner_id || defaultPartner || "0"); setRows([]); setMsg(JSON.stringify(d).slice(0, 500)); }, "Fetched AI-available DIDs")}>AI free</Button>
          </div>
        </div>
      </Card>

      {selected.length > 0 && (
        <Card className="mb-3 flex flex-wrap items-center gap-2 p-3 text-sm">
          <span>{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => { if (confirm(`Unassign ${selected.length} DID(s)? This DELETES the DID records from the database — the numbers will no longer be usable for calls until re-assigned.`)) act(() => unassignDids(selected), `Unassigned ${selected.length} DID(s)`); }}>Unassign</Button>
          <Button size="sm" variant="outline" onClick={() => act(() => updateDidStatus({ did_numbers: selected, action: "set_available" }), "Marked available")}>Set available</Button>
          <Button size="sm" variant="outline" onClick={() => act(() => updateDidStatus({ did_numbers: selected, action: "mark_cooling_period" }), "Marked cooling")}>Cooling</Button>
        </Card>
      )}

      {loading ? <TableSkeleton rows={6} cols={8} /> : rows.length === 0 ? <EmptyState message="No normal DIDs in inventory." hint="list-dids covers normal-type DIDs only — AI-agent DIDs appear in the panel below." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2"></th><th className="px-3 py-2">DID</th><th className="px-3 py-2">Layer</th><th className="px-3 py-2">Parent</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Partner</th><th className="px-3 py-2">Board</th><th className="px-3 py-2">Agent</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.did_number} className="border-b last:border-0">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(d.did_number)} onChange={() => toggle(d.did_number)} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{d.did_number}</td>
                  <td className="px-3 py-2"><Badge tone={d.did_layer === "internal" ? "blue" : "green"}>{d.did_layer ?? "external"}</Badge></td>
                  <td className="px-3 py-2 font-mono text-xs">{d.parent_did_number ?? "—"}</td>
                  <td className="px-3 py-2"><Badge tone={d.status === "available" ? "green" : d.status === "mapped" ? "blue" : "amber"}>{d.status}</Badge></td>
                  <td className="px-3 py-2">{d.partner_id ?? "—"}</td>
                  <td className="px-3 py-2">{d.workspace_id ?? "—"}</td>
                  <td className="px-3 py-2">{d.agent_id ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {total != null && <p className="mt-2 text-xs text-zinc-500">total {total}</p>}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">Pool utilization (external / internal)</h2>
            <Button size="sm" variant="outline" onClick={loadPool} disabled={poolLoading}>{poolLoading ? "Loading…" : "Refresh"}</Button>
          </div>
          {pool.length === 0 ? (
            <p className="py-3 text-center text-sm text-zinc-500">No pool data yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs uppercase text-zinc-500"><th className="py-1">Layer</th><th className="py-1">Status</th><th className="py-1 text-right">Count</th></tr></thead>
              <tbody>
                {pool.map((r, i) => (
                  <tr key={i} className="border-b last:border-0"><td className="py-1"><Badge tone={r.did_layer === "internal" ? "blue" : "green"}>{r.did_layer}</Badge></td><td className="py-1">{r.status}</td><td className="py-1 text-right font-mono">{r.count}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Import external DIDs (wholesaler pool)</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Vendor ID</Label><Input value={importForm.vendor_id} onChange={(e) => setImportForm({ ...importForm, vendor_id: e.target.value })} placeholder="ObjectId" /></div>
            <div><Label>Vendor config ID (optional)</Label><Input value={importForm.vendor_config_id} onChange={(e) => setImportForm({ ...importForm, vendor_config_id: e.target.value })} /></div>
            <div className="col-span-2"><Label>DID numbers (comma separated)</Label><Input value={importForm.did_numbers} onChange={(e) => setImportForm({ ...importForm, did_numbers: e.target.value })} placeholder="911234567890, 911234567891" /></div>
            <div className="col-span-2"><Label>Display name (optional)</Label><Input value={importForm.display_name} onChange={(e) => setImportForm({ ...importForm, display_name: e.target.value })} /></div>
          </div>
          <Button size="sm" className="mt-2" onClick={() => {
            const nums = importForm.did_numbers.split(",").map((s) => s.trim()).filter(Boolean);
            if (!importForm.vendor_id || nums.length === 0) { setError("Vendor ID + at least one DID required"); return; }
            act(() => importExternalDids({ vendor_id: importForm.vendor_id, vendor_config_id: importForm.vendor_config_id || undefined, did_numbers: nums, display_name: importForm.display_name || undefined }), `Imported ${nums.length} external DID(s)`);
          }}>Import</Button>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Provision internal DID from external parent</h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2"><Label>Parent (external) DID</Label><Input value={provisionForm.parent_did_number} onChange={(e) => setProvisionForm({ ...provisionForm, parent_did_number: e.target.value })} placeholder="911234567890" /></div>
            <div><Label>Partner ID</Label><Input value={String(provisionForm.partner_id ?? "")} onChange={(e) => setProvisionForm({ ...provisionForm, partner_id: e.target.value })} /></div>
            <div><Label>Workspace ID (optional)</Label><Input value={provisionForm.workspace_id} onChange={(e) => setProvisionForm({ ...provisionForm, workspace_id: e.target.value })} /></div>
            <div className="col-span-2"><Label>Agent ID (optional)</Label><Input value={provisionForm.agent_id} onChange={(e) => setProvisionForm({ ...provisionForm, agent_id: e.target.value })} /></div>
          </div>
          <Button size="sm" className="mt-2" onClick={() => {
            if (!provisionForm.parent_did_number || !provisionForm.partner_id) { setError("Parent DID + Partner required"); return; }
            act(() => provisionInternalDid({
              parent_did_number: provisionForm.parent_did_number,
              partner_id: Number(provisionForm.partner_id),
              workspace_id: provisionForm.workspace_id ? Number(provisionForm.workspace_id) : undefined,
              agent_id: provisionForm.agent_id ? Number(provisionForm.agent_id) : undefined,
            }), "Internal DID provisioned");
          }}>Provision</Button>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Map external ↔ internal</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>External DID</Label><Input value={mapForm.external_did_number} onChange={(e) => setMapForm({ ...mapForm, external_did_number: e.target.value })} /></div>
            <div><Label>Internal DID</Label><Input value={mapForm.internal_did_number} onChange={(e) => setMapForm({ ...mapForm, internal_did_number: e.target.value })} /></div>
            <div className="col-span-2"><Label>Partner ID</Label><Input value={String(mapForm.partner_id ?? "")} onChange={(e) => setMapForm({ ...mapForm, partner_id: e.target.value })} /></div>
          </div>
          <Button size="sm" className="mt-2" variant="outline" onClick={() => {
            if (!mapForm.external_did_number || !mapForm.internal_did_number || !mapForm.partner_id) { setError("External + Internal + Partner required"); return; }
            act(() => mapExternalInternalDid({ external_did_number: mapForm.external_did_number, internal_did_number: mapForm.internal_did_number, partner_id: Number(mapForm.partner_id) }), "Mapping updated");
          }}>Map</Button>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium">AI-agent DIDs (partner {aiForm.partner_id || defaultPartner || "—"})</h2>
            <Button size="sm" variant="outline" onClick={loadAiDids} disabled={aiLoading}>{aiLoading ? "Loading…" : "Refresh"}</Button>
          </div>
          {aiDids.length === 0 ? (
            <p className="py-3 text-center text-sm text-zinc-500">No free AI-agent DIDs for this partner.</p>
          ) : (
            <ul className="max-h-44 space-y-1 overflow-y-auto">
              {aiDids.map((d) => (
                <li key={d} className="flex items-center justify-between rounded-md bg-zinc-50 px-2.5 py-1.5 font-mono text-xs">
                  <span>{d}</span>
                  <button
                    className="font-sans font-semibold text-blue-600 hover:underline cursor-pointer"
                    onClick={() => setAiForm({ ...aiForm, did_number: d })}
                  >
                    Use ↓
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Assign DIDs (JSON body)</h2>
          <textarea rows={5} className="w-full rounded-md border border-zinc-300 p-2 font-mono text-xs" value={assignJson} onChange={(e) => setAssignJson(e.target.value)} />
          <Button size="sm" className="mt-2" onClick={() => { try { act(() => assignDids(JSON.parse(assignJson)), "Assign request sent"); } catch { setError("Invalid JSON"); } }}>Assign</Button>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">AI-agent DID bind / release</h2>
          <p className="mb-2 text-xs text-zinc-500">
            VoiceAI/engine-routed: DID + Partner only (agent comes from the engine Numbers UI).
            makun-ai campaign DIDs still use Agent bot ID.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Partner ID</Label><Input value={aiForm.partner_id} onChange={(e) => setAiForm({ ...aiForm, partner_id: e.target.value })} /></div>
            <div><Label>Agent bot ID (optional — empty = VoiceAI)</Label><Input value={aiForm.agent_bot_id} placeholder="empty for VoiceAI" onChange={(e) => setAiForm({ ...aiForm, agent_bot_id: e.target.value })} /></div>
            <div className="col-span-2"><Label>DID (optional for assign)</Label><Input value={aiForm.did_number} onChange={(e) => setAiForm({ ...aiForm, did_number: e.target.value })} /></div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => act(() => {
              const body: { partner_id: number; did_number?: string; agent_bot_id?: number } = {
                partner_id: Number(aiForm.partner_id),
              };
              if (aiForm.did_number) body.did_number = aiForm.did_number;
              // Empty = partner-only VoiceAI path (backend leaves agent_bot_id=0).
              if (aiForm.agent_bot_id !== "") body.agent_bot_id = Number(aiForm.agent_bot_id);
              return assignAiAgentDid(body);
            }, "AI DID assigned")}>Assign AI DID</Button>
            <Button size="sm" variant="outline" onClick={() => act(() => releaseAiAgentDid({ partner_id: Number(aiForm.partner_id), agent_bot_id: aiForm.agent_bot_id }), "AI DID released")}>Release</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
