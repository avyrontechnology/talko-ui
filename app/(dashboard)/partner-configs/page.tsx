"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Badge, Button, Card, Input, Label, Textarea } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createPartnerConfig, fetchPartnerConfigs, updatePartnerConfig } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { PartnerConfig } from "@/lib/types";

export default function PartnerConfigsPage() {
  const [rows, setRows] = useState<PartnerConfig[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ partner_id: "", vendor_id: "", vendor_config_id: "", service_board_ids: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("{}");

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
        vendor_id: form.vendor_id,
        vendor_config_id: form.vendor_config_id,
        service_board_ids: form.service_board_ids.split(",").map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)),
      });
      setForm({ partner_id: "", vendor_id: "", vendor_config_id: "", service_board_ids: "" });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updatePartnerConfig(editing, JSON.parse(editJson));
      setEditing(null);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Partner Configs" subtitle="POST/GET/PATCH /partner_configs" icon={Users} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 p-4">
        <h2 className="mb-2 font-medium">Create partner config</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <div><Label>Partner ID *</Label><Input value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })} /></div>
          <div><Label>Vendor ID *</Label><Input value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} /></div>
          <div><Label>Vendor config ID *</Label><Input value={form.vendor_config_id} onChange={(e) => setForm({ ...form, vendor_config_id: e.target.value })} /></div>
          <div><Label>Service board IDs</Label><Input value={form.service_board_ids} onChange={(e) => setForm({ ...form, service_board_ids: e.target.value })} placeholder="12, 34" /></div>
        </div>
        <Button size="sm" className="mt-2" onClick={create} disabled={!form.partner_id || !form.vendor_id || !form.vendor_config_id}>Create</Button>
      </Card>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rows.length === 0 ? <EmptyState message="No partner configs." /> : (
        <div className="space-y-2">
          {rows.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">Partner {c.partner_id} <Badge tone={c.is_active ? "green" : "zinc"}>{c.is_active ? "active" : "inactive"}</Badge></p>
                  <p className="font-mono text-xs text-zinc-500">{c.id} · vendor {c.vendor_id}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditing(c.id); setEditJson(JSON.stringify({ is_active: c.is_active }, null, 2)); }}>Edit JSON</Button>
              </div>
              {editing === c.id && (
                <div className="mt-2">
                  <Textarea rows={5} value={editJson} onChange={(e) => setEditJson(e.target.value)} className="font-mono text-xs" />
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
