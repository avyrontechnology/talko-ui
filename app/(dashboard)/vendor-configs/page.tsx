"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createVendorConfig, fetchVendorConfigs, updateVendorConfig } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { VendorConfig } from "@/lib/types";

export default function VendorConfigsPage() {
  const [rows, setRows] = useState<VendorConfig[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ vendor_id: "", name: "", available_did: "", generic_url_handler: "{}" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("{}");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchVendorConfigs());
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
      await createVendorConfig({
        vendor_id: form.vendor_id,
        name: form.name || undefined,
        available_did: form.available_did.split(",").map((s) => s.trim()).filter(Boolean),
        generic_url_handler: JSON.parse(form.generic_url_handler || "{}"),
      });
      setForm({ vendor_id: "", name: "", available_did: "", generic_url_handler: "{}" });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateVendorConfig(editing, JSON.parse(editJson));
      setEditing(null);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Vendor Configs" subtitle="POST/GET/PATCH /vendor_configs" icon={Settings2} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 p-4">
        <h2 className="mb-2 font-medium">Create vendor config</h2>
        <div className="grid gap-2 md:grid-cols-4">
          <div><Label>Vendor ID *</Label><Input value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} /></div>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Available DIDs (comma separated)</Label><Input value={form.available_did} onChange={(e) => setForm({ ...form, available_did: e.target.value })} /></div>
          <div><Label>generic_url_handler (JSON)</Label><Input value={form.generic_url_handler} onChange={(e) => setForm({ ...form, generic_url_handler: e.target.value })} /></div>
        </div>
        <Button size="sm" className="mt-2" onClick={create} disabled={!form.vendor_id}>Create</Button>
      </Card>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rows.length === 0 ? <EmptyState message="No vendor configs." /> : (
        <div className="space-y-2">
          {rows.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name || c.vendor_name || c.id}</p>
                  <p className="font-mono text-xs text-zinc-500">{c.id} · vendor {c.vendor_id} · {(c.available_did ?? []).length} DIDs</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setEditing(c.id); setEditJson(JSON.stringify({ generic_url_handler: c.generic_url_handler ?? {} }, null, 2)); }}>
                  Edit handlers
                </Button>
              </div>
              {editing === c.id && (
                <div className="mt-2">
                  <Textarea rows={6} value={editJson} onChange={(e) => setEditJson(e.target.value)} className="font-mono text-xs" />
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
