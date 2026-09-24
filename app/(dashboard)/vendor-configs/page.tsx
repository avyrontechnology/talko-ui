"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { Skeleton } from "@/components/primitives";
import { createVendorConfig, fetchChannelPool, fetchVendorConfigs, setChannelPool, updateVendorConfig } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { ChannelPoolStatus, VendorConfig } from "@/lib/types";

export default function VendorConfigsPage() {
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const [rows, setRows] = useState<VendorConfig[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ vendor_id: "", name: "", available_did: "", generic_url_handler: "{}", max_channels: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [editJson, setEditJson] = useState("{}");
  const [pools, setPools] = useState<Record<string, ChannelPoolStatus>>({});
  const [poolForm, setPoolForm] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const configs = await fetchVendorConfigs();
      setRows(configs);
      const entries = await Promise.all(
        configs.map(async (c) => {
          try {
            const pool = await fetchChannelPool(c.id);
            return [c.id, pool] as const;
          } catch {
            return [c.id, null] as const;
          }
        }),
      );
      const next: Record<string, ChannelPoolStatus> = {};
      for (const [id, pool] of entries) {
        if (pool) next[id] = pool;
      }
      setPools(next);
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
      const max = form.max_channels.trim() === "" ? undefined : Number(form.max_channels);
      if (max !== undefined && (!Number.isInteger(max) || max < 1)) {
        setError("max_channels must be a positive integer or empty (unlimited)");
        return;
      }
      await createVendorConfig({
        vendor_id: form.vendor_id,
        name: form.name || undefined,
        available_did: form.available_did.split(",").map((s) => s.trim()).filter(Boolean),
        generic_url_handler: JSON.parse(form.generic_url_handler || "{}"),
        ...(max !== undefined ? { channel_pool: { max_channels: max, reserved_channels: 0 } } : {}),
      });
      setForm({ vendor_id: "", name: "", available_did: "", generic_url_handler: "{}", max_channels: "" });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const savePool = async (id: string) => {
    setError("");
    setMsg("");
    try {
      const raw = (poolForm[id] ?? "").trim();
      const max = raw === "" ? null : Number(raw);
      if (max !== null && (!Number.isInteger(max) || (max as number) < 1)) {
        setError("max_channels must be a positive integer or empty (unlimited)");
        return;
      }
      const pool = await setChannelPool(id, { max_channels: max, reserved_channels: 0 });
      setPools((p) => ({ ...p, [id]: pool }));
      setMsg(`Pool updated for ${id.slice(-6)}`);
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
      {isSuperadmin === false ? (
        <Card className="mt-4 p-6 text-sm text-slate/70">
          Vendor configs are limited to superadmins. Sign in with a superadmin account.
        </Card>
      ) : (
      <>
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      {msg && <Card className="mb-3 border-green-200 bg-green-50 p-3 text-sm text-green-700">{msg}</Card>}
      <Card className="mb-3 p-4">
        <h2 className="mb-2 font-medium">Create vendor config</h2>
        <div className="grid gap-2 md:grid-cols-5">
          <div><Label>Vendor ID *</Label><Input value={form.vendor_id} onChange={(e) => setForm({ ...form, vendor_id: e.target.value })} /></div>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Available DIDs (comma separated)</Label><Input value={form.available_did} onChange={(e) => setForm({ ...form, available_did: e.target.value })} /></div>
          <div><Label>Max channels (empty = unlimited)</Label><Input value={form.max_channels} onChange={(e) => setForm({ ...form, max_channels: e.target.value })} placeholder="e.g. 10" /></div>
          <div><Label>generic_url_handler (JSON)</Label><Input value={form.generic_url_handler} onChange={(e) => setForm({ ...form, generic_url_handler: e.target.value })} /></div>
        </div>
        <Button size="sm" className="mt-2" onClick={create} disabled={!form.vendor_id}>Create</Button>
      </Card>
      {loading ? <Skeleton className="h-24" /> : rows.length === 0 ? <EmptyState message="No vendor configs." /> : (
        <div className="space-y-2">
          {rows.map((c) => {
            const handlers: Array<[string, unknown]> = [
              ["generic", c.generic_url_handler],
              ["cdr", c.cdr_url_handler],
              ["dialer", c.dialer_url_handler],
              ["c2c", c.c2c_support_url_handler],
              ["hangup", c.hangup_url_handler],
              ["transfer", c.transfer_url_handler],
              ["live", c.live_calls_url_handler],
            ];
            return (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{c.name || c.vendor_name || c.id}</p>
                  <p className="font-mono text-xs text-zinc-500">{c.id} · vendor {c.vendor_id} · {(c.available_did ?? []).length} DIDs</p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    {handlers.map(([k, v]) => `${k}:${v && Object.keys(v as object).length ? "✓" : "—"}`).join(" · ")}
                    {c.created_at ? ` · created ${c.created_at}` : ""}
                    {c.updated_at ? ` · updated ${c.updated_at}` : ""}
                  </p>
                  <details className="mt-1">
                    <summary className="cursor-pointer text-xs text-zinc-500">View all fields</summary>
                    <pre className="mt-1 max-h-64 overflow-auto rounded bg-zinc-50 p-2 font-mono text-xs">{JSON.stringify(c, null, 2)}</pre>
                  </details>
                  <p className="mt-1 text-xs text-zinc-600">
                    Pool: {pools[c.id] ? (
                      <span className="font-mono">
                        {pools[c.id].in_use}/{pools[c.id].max_channels ?? "∞"} in use
                        {pools[c.id].available != null && ` · ${pools[c.id].available} free`}
                      </span>
                    ) : (
                      <span className="text-zinc-400">unlimited / not loaded</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={poolForm[c.id] ?? ""}
                    onChange={(e) => setPoolForm({ ...poolForm, [c.id]: e.target.value })}
                    placeholder={pools[c.id]?.max_channels != null ? String(pools[c.id].max_channels) : "max (∞)"}
                    className="w-24"
                  />
                  <Button size="sm" variant="outline" onClick={() => savePool(c.id)}>Set pool</Button>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c.id); setEditJson(JSON.stringify({ generic_url_handler: c.generic_url_handler ?? {}, cdr_url_handler: c.cdr_url_handler ?? undefined, dialer_url_handler: c.dialer_url_handler ?? undefined, c2c_support_url_handler: c.c2c_support_url_handler ?? undefined, hangup_url_handler: c.hangup_url_handler ?? undefined, transfer_url_handler: c.transfer_url_handler ?? undefined, live_calls_url_handler: c.live_calls_url_handler ?? undefined }, null, 2)); }}>
                    Edit handlers
                  </Button>
                </div>
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
            );
          })}
        </div>
      )}
      </>
      )}
    </div>
  );
}
