"use client";

import { useState } from "react";
import { PhoneForwarded } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createAgentMapping, createWorkspaceMapping, fetchAgentMappings, fetchWorkspaceAgents } from "@/lib/services";
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
  const [workspaceForm, setWorkspaceForm] = useState({ workspace_id: "", agent_id: "", agent_number: "" });

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

  const handleCreateWorkspaceMapping = async () => {
    setError("");
    try {
      await createWorkspaceMapping({
        partner_id: Number(partnerId),
        workspace_id: Number(workspaceForm.workspace_id),
        agent_id: workspaceForm.agent_id,
        agent_number: workspaceForm.agent_number || undefined,
      });
      const data = await fetchWorkspaceAgents({ workspace_id: workspaceForm.workspace_id, partner_id: partnerId });
      setRows(data);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Agent Mapping" subtitle="Agent→DID and agent→workspace mappings" icon={PhoneForwarded} actions={<Button size="sm" onClick={load} disabled={loading}>Search</Button>} />
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
          <h2 className="mb-2 font-medium">Agent → workspace mapping</h2>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Workspace ID</Label><Input value={workspaceForm.workspace_id} onChange={(e) => setWorkspaceForm({ ...workspaceForm, workspace_id: e.target.value })} /></div>
            <div><Label>Agent ID</Label><Input value={workspaceForm.agent_id} onChange={(e) => setWorkspaceForm({ ...workspaceForm, agent_id: e.target.value })} /></div>
            <div><Label>Agent number</Label><Input value={workspaceForm.agent_number} onChange={(e) => setWorkspaceForm({ ...workspaceForm, agent_number: e.target.value })} /></div>
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={handleCreateWorkspaceMapping} disabled={!workspaceForm.workspace_id || !workspaceForm.agent_id || !partnerId}>Map to workspace</Button>
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
                  <td className="px-3 py-2">{r.workspace_id ?? "—"}</td>
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
