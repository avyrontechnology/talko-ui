"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createPartnerConfig, fetchClients, fetchPartnerConfigs, updatePartnerConfig } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { ClientItem, PartnerConfig } from "@/lib/types";

export default function PartnerConfigsPage() {
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const role = useAuthStore((s) => s.role);
  const [rows, setRows] = useState<PartnerConfig[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ partner_id: "", client_id: "", vendor_id: "", vendor_config_id: "", workspace_ids: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    is_active: true,
    client_id: "",
    ai_vendor_config_id: "",
    enable_round_robin: false,
    enable_agent_mapping: false,
    enable_workspace: false,
    dialer_enabled: false,
    enable_agent_reassignment_on_inactive: false,
    enable_inbound_round_robin: false,
    workspace_ids: "",
    workspace_did_counts: "",
    agent_mapping_ids: "",
    round_robin_did_count: "",
  });
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  const loadClients = async (partnerId: string) => {
    const pid = partnerId.trim();
    if (!pid) {
      setClients([]);
      return;
    }
    setClientsLoading(true);
    try {
      setClients(await fetchClients(pid));
    } catch {
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchPartnerConfigs());
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial data load on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  const create = async () => {
    setError("");
    try {
      await createPartnerConfig({
        partner_id: Number(form.partner_id),
        ...(form.client_id.trim() ? { client_id: form.client_id.trim() } : {}),
        vendor_id: form.vendor_id,
        vendor_config_id: form.vendor_config_id,
        workspace_ids: form.workspace_ids.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)),
      });
      setForm({ partner_id: "", client_id: "", vendor_id: "", vendor_config_id: "", workspace_ids: "" });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const openEdit = (c: PartnerConfig) => {
    setEditing(c.id);
    setEditForm({
      is_active: c.is_active ?? true,
      client_id: typeof c.client_id === "string" ? c.client_id : "",
      ai_vendor_config_id: typeof c.ai_vendor_config_id === "string" ? c.ai_vendor_config_id : "",
      enable_round_robin: Boolean(c.enable_round_robin),
      enable_agent_mapping: Boolean(c.enable_agent_mapping),
      enable_workspace: Boolean(c.enable_workspace),
      dialer_enabled: Boolean(c.dialer_enabled),
      enable_agent_reassignment_on_inactive: Boolean(c.enable_agent_reassignment_on_inactive),
      enable_inbound_round_robin: Boolean(c.enable_inbound_round_robin),
      workspace_ids: Array.isArray(c.workspace_ids) ? c.workspace_ids.join(", ") : "",
      workspace_did_counts:
        c.workspace_did_counts && typeof c.workspace_did_counts === "object"
          ? JSON.stringify(c.workspace_did_counts)
          : "",
      agent_mapping_ids: Array.isArray(c.agent_mapping_ids) ? c.agent_mapping_ids.join(", ") : "",
      round_robin_did_count:
        c.round_robin_did_count === null || c.round_robin_did_count === undefined ? "" : String(c.round_robin_did_count),
    });
    void loadClients(String(c.partner_id));
  };

  const saveEdit = async () => {
    if (!editing) return;
    setError("");
    const numList = (s: string) =>
      s.split(",").map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n));
    let didCounts: Record<string, number> | undefined;
    if (editForm.workspace_did_counts.trim()) {
      try {
        didCounts = JSON.parse(editForm.workspace_did_counts);
      } catch {
        setError('workspace_did_counts must be valid JSON, e.g. {"5": 5}');
        return;
      }
    }
    const agentIds = editForm.agent_mapping_ids.trim() ? numList(editForm.agent_mapping_ids) : undefined;
    const rrCount = editForm.round_robin_did_count.trim() === "" ? undefined : Number(editForm.round_robin_did_count.trim());
    if (rrCount !== undefined && (!Number.isInteger(rrCount) || rrCount < 1)) {
      setError("round_robin_did_count must be a positive integer or empty");
      return;
    }
    try {
      await updatePartnerConfig(editing, {
        is_active: editForm.is_active,
        client_id: editForm.client_id.trim() ? editForm.client_id.trim() : null,
        ai_vendor_config_id: editForm.ai_vendor_config_id.trim() ? editForm.ai_vendor_config_id.trim() : null,
        enable_round_robin: editForm.enable_round_robin,
        enable_agent_mapping: editForm.enable_agent_mapping,
        enable_workspace: editForm.enable_workspace,
        dialer_enabled: editForm.dialer_enabled,
        enable_agent_reassignment_on_inactive: editForm.enable_agent_reassignment_on_inactive,
        enable_inbound_round_robin: editForm.enable_inbound_round_robin,
        workspace_ids: numList(editForm.workspace_ids),
        ...(didCounts !== undefined ? { workspace_did_counts: didCounts } : {}),
        ...(agentIds !== undefined ? { agent_mapping_ids: agentIds } : {}),
        ...(rrCount !== undefined ? { round_robin_did_count: rrCount } : {}),
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  // Viewers get no access; maintainers see only their own partner's
  // wiring (the backend scopes the list), superadmins see everything.
  const viewerBlocked = isSuperadmin === false && role === "viewer";

  return (
    <div>
      <PageHeader title="Partner Configs" subtitle="POST/GET/PATCH /partner_configs" icon={Users} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {viewerBlocked ? (
        <Card className="mt-4 p-6 text-sm text-slate/70">
          Partner configs are limited to superadmins and maintainers. Sign in with a
          maintainer or superadmin account.
        </Card>
      ) : (
      <>
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 p-4">
        <h2 className="mb-2 font-medium">Create partner config</h2>
        <div className="grid gap-2 md:grid-cols-5">
          <div><Label>Partner ID *</Label><Input value={form.partner_id} onChange={(e) => { setForm({ ...form, partner_id: e.target.value, client_id: "" }); void loadClients(e.target.value); }} /></div>
          <div>
            <Label>Client (optional)</Label>
            <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
              <option value="">— partner-level (no client) —</option>
              {clients.map((cl) => (
                <option key={cl.id} value={cl.id}>{cl.name} ({cl.id.slice(-6)})</option>
              ))}
            </Select>
            {clientsLoading && <p className="mt-1 text-xs text-zinc-400">Loading clients…</p>}
          </div>
          <div><Label>Vendor ID *</Label><Input value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} /></div>
          <div><Label>Vendor config ID *</Label><Input value={form.vendor_config_id} onChange={(e) => setForm({ ...form, vendor_config_id: e.target.value })} /></div>
          <div><Label>Workspace IDs</Label><Input value={form.workspace_ids} onChange={(e) => setForm({ ...form, workspace_ids: e.target.value })} placeholder="12, 34" /></div>
        </div>
        <Button size="sm" className="mt-2" onClick={create} disabled={!form.partner_id || !form.vendor_id || !form.vendor_config_id}>Create</Button>
      </Card>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rows.length === 0 ? <EmptyState message="No partner configs." /> : (
        <div className="space-y-2">
          {rows.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Partner {c.partner_id}{c.client_id ? ` · Client ${c.client_id}` : ""} <Badge tone={c.is_active ? "green" : "zinc"}>{c.is_active ? "active" : "inactive"}</Badge></p>
                  <p className="font-mono text-xs text-zinc-500">{c.id} · vendor {c.vendor_id}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    vendor_config {String(c.vendor_config_id ?? "—")}
                    {" · "}workspaces {Array.isArray(c.workspace_ids) ? c.workspace_ids.join(", ") : "—"}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    round_robin {String(c.enable_round_robin ?? false)}
                    {" · "}agent_mapping {String(c.enable_agent_mapping ?? false)}
                    {" · "}workspace {String(c.enable_workspace ?? false)}
                    {" · "}dialer {String(c.dialer_enabled ?? false)}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
              </div>
              {editing === c.id && (
                <div className="mt-3 border-t pt-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <Label>Client</Label>
                      <Select value={editForm.client_id} onChange={(e) => setEditForm({ ...editForm, client_id: e.target.value })}>
                        <option value="">— partner-level (no client) —</option>
                        {clients.map((cl) => (
                          <option key={cl.id} value={cl.id}>{cl.name} ({cl.id.slice(-6)})</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>AI vendor config ID</Label>
                      <Input value={editForm.ai_vendor_config_id} onChange={(e) => setEditForm({ ...editForm, ai_vendor_config_id: e.target.value })} placeholder="empty = none" />
                    </div>
                    <div>
                      <Label>Workspace IDs</Label>
                      <Input value={editForm.workspace_ids} onChange={(e) => setEditForm({ ...editForm, workspace_ids: e.target.value })} placeholder="98, 11" />
                    </div>
                    <div>
                      <Label>Workspace DID counts (JSON)</Label>
                      <Input value={editForm.workspace_did_counts} onChange={(e) => setEditForm({ ...editForm, workspace_did_counts: e.target.value })} placeholder='{"98": 3}' />
                    </div>
                    <div>
                      <Label>Agent mapping IDs</Label>
                      <Input value={editForm.agent_mapping_ids} onChange={(e) => setEditForm({ ...editForm, agent_mapping_ids: e.target.value })} placeholder="1, 2" />
                    </div>
                    <div>
                      <Label>Round-robin DID count</Label>
                      <Input value={editForm.round_robin_did_count} onChange={(e) => setEditForm({ ...editForm, round_robin_did_count: e.target.value })} placeholder="empty" />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4">
                    {(
                      [
                        ["is_active", "Active"],
                        ["enable_round_robin", "Round robin"],
                        ["enable_agent_mapping", "Agent mapping"],
                        ["enable_workspace", "Workspace mode"],
                        ["dialer_enabled", "Dialer"],
                        ["enable_agent_reassignment_on_inactive", "Reassign on inactive"],
                        ["enable_inbound_round_robin", "Inbound round robin"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                          checked={editForm[key]}
                          onChange={(e) => setEditForm({ ...editForm, [key]: e.target.checked })}
                          className="h-4 w-4 accent-red-500"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => void loadClients(String(c.partner_id))}>Reload clients</Button>
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
