"use client";

import { useState } from "react";
import { ListOrdered } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import {
  assignAiAgentDid,
  assignDids,
  fetchAiAvailableDids,
  fetchDidList,
  fetchDidsByBoard,
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
  const [boardId, setBoardId] = useState("");
  const [didFilter, setDidFilter] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [assignJson, setAssignJson] = useState('{"dids_for_service_board": []}');
  const [aiForm, setAiForm] = useState({ partner_id: defaultPartner, agent_bot_id: "", did_number: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (status) params.status = status;
      if (boardId) params.service_board_id = boardId;
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
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

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
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div><Label>Status</Label><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Any</option><option value="available">available</option><option value="mapped">mapped</option><option value="cooling_period">cooling_period</option><option value="cooldown_completed">cooldown_completed</option></Select></div>
          <div><Label>Service board ID</Label><Input value={boardId} onChange={(e) => setBoardId(e.target.value)} /></div>
          <div><Label>DID number</Label><Input value={didFilter} onChange={(e) => setDidFilter(e.target.value)} /></div>
          <div className="flex items-end gap-2">
            <Button size="sm" variant="outline" onClick={() => boardId && act(() => fetchDidsByBoard(boardId), "Loaded board DIDs — see response in table refresh")}>By board</Button>
            <Button size="sm" variant="outline" onClick={() => act(async () => { const d = await fetchAiAvailableDids(aiForm.partner_id || defaultPartner || "0"); setRows([]); setMsg(JSON.stringify(d).slice(0, 500)); }, "Fetched AI-available DIDs")}>AI free</Button>
          </div>
        </div>
      </Card>

      {selected.length > 0 && (
        <Card className="mb-3 flex flex-wrap items-center gap-2 p-3 text-sm">
          <span>{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={() => act(() => unassignDids(selected), `Unassigned ${selected.length} DID(s)`)}>Unassign</Button>
          <Button size="sm" variant="outline" onClick={() => act(() => updateDidStatus({ did_numbers: selected, action: "set_available" }), "Marked available")}>Set available</Button>
          <Button size="sm" variant="outline" onClick={() => act(() => updateDidStatus({ did_numbers: selected, action: "mark_cooling_period" }), "Marked cooling")}>Cooling</Button>
        </Card>
      )}

      {rows.length === 0 ? <EmptyState message="No DIDs. Run a search above." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2"></th><th className="px-3 py-2">DID</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Partner</th><th className="px-3 py-2">Board</th><th className="px-3 py-2">Agent</th></tr></thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.did_number} className="border-b last:border-0">
                  <td className="px-3 py-2"><input type="checkbox" checked={selected.includes(d.did_number)} onChange={() => toggle(d.did_number)} /></td>
                  <td className="px-3 py-2 font-mono text-xs">{d.did_number}</td>
                  <td className="px-3 py-2"><Badge tone={d.status === "available" ? "green" : d.status === "mapped" ? "blue" : "amber"}>{d.status}</Badge></td>
                  <td className="px-3 py-2">{d.partner_id ?? "—"}</td>
                  <td className="px-3 py-2">{d.service_board_id ?? "—"}</td>
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
          <h2 className="mb-2 font-medium">Assign DIDs (JSON body)</h2>
          <textarea rows={5} className="w-full rounded-md border border-zinc-300 p-2 font-mono text-xs" value={assignJson} onChange={(e) => setAssignJson(e.target.value)} />
          <Button size="sm" className="mt-2" onClick={() => { try { act(() => assignDids(JSON.parse(assignJson)), "Assign request sent"); } catch { setError("Invalid JSON"); } }}>Assign</Button>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">AI-agent DID bind / release</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Partner ID</Label><Input value={aiForm.partner_id} onChange={(e) => setAiForm({ ...aiForm, partner_id: e.target.value })} /></div>
            <div><Label>Agent bot ID</Label><Input value={aiForm.agent_bot_id} onChange={(e) => setAiForm({ ...aiForm, agent_bot_id: e.target.value })} /></div>
            <div className="col-span-2"><Label>DID (optional for assign)</Label><Input value={aiForm.did_number} onChange={(e) => setAiForm({ ...aiForm, did_number: e.target.value })} /></div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => act(() => assignAiAgentDid({ partner_id: Number(aiForm.partner_id), agent_bot_id: aiForm.agent_bot_id, did_number: aiForm.did_number || undefined }), "AI DID assigned")}>Assign AI DID</Button>
            <Button size="sm" variant="outline" onClick={() => act(() => releaseAiAgentDid({ partner_id: Number(aiForm.partner_id), agent_bot_id: aiForm.agent_bot_id }), "AI DID released")}>Release</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
