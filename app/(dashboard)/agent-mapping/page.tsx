"use client";

import { useState } from "react";
import { PhoneForwarded } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createAgentMapping, createBoardMapping, fetchAgentMappings, fetchBoardAgents } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { AgentMapping } from "@/lib/types";

export default function AgentMappingPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [rows, setRows] = useState<AgentMapping[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [partnerId, setPartnerId] = useState(defaultPartner);
  const [boardForm, setBoardForm] = useState({ service_board_id: "", agent_id: "", agent_number: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchAgentMappings({ agent_id: agentId || undefined, partner_id: partnerId || undefined }));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setError("");
    try {
      await createAgentMapping({ agent_id: agentId, partner_id: Number(partnerId) });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const createBoard = async () => {
    setError("");
    try {
      await createBoardMapping({
        partner_id: Number(partnerId),
        service_board_id: Number(boardForm.service_board_id),
        agent_id: boardForm.agent_id,
        agent_number: boardForm.agent_number || undefined,
      });
      const data = await fetchBoardAgents({ service_board_id: boardForm.service_board_id, partner_id: partnerId });
      setRows(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Agent Mapping" subtitle="Agent→DID and agent→board mappings" icon={PhoneForwarded} actions={<Button size="sm" onClick={load} disabled={loading}>Search</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Agent → DID mapping</h2>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Agent ID</Label><Input value={agentId} onChange={(e) => setAgentId(e.target.value)} /></div>
            <div><Label>Partner ID</Label><Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} /></div>
          </div>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={create} disabled={!agentId || !partnerId}>Create mapping</Button>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Agent → board mapping</h2>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Board ID</Label><Input value={boardForm.service_board_id} onChange={(e) => setBoardForm({ ...boardForm, service_board_id: e.target.value })} /></div>
            <div><Label>Agent ID</Label><Input value={boardForm.agent_id} onChange={(e) => setBoardForm({ ...boardForm, agent_id: e.target.value })} /></div>
            <div><Label>Agent number</Label><Input value={boardForm.agent_number} onChange={(e) => setBoardForm({ ...boardForm, agent_number: e.target.value })} /></div>
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={createBoard} disabled={!boardForm.service_board_id || !boardForm.agent_id || !partnerId}>Map to board</Button>
        </Card>
      </div>
      {rows.length === 0 ? <EmptyState message="No mappings. Search above." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Partner</th><th className="px-3 py-2">Board</th><th className="px-3 py-2">Number</th><th className="px-3 py-2">Active</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2">{r.agent_id}</td>
                  <td className="px-3 py-2">{r.partner_id}</td>
                  <td className="px-3 py-2">{r.service_board_id ?? "—"}</td>
                  <td className="px-3 py-2">{r.agent_number ?? (r.did ?? []).join(", ") ?? "—"}</td>
                  <td className="px-3 py-2"><Badge tone={r.is_active ? "green" : "zinc"}>{String(r.is_active ?? "—")}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
