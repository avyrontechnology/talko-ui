"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createApiKey, fetchApiKeys, revokeApiKey } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { ApiKeyItem } from "@/lib/types";

export default function ApiKeysPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [partnerId, setPartnerId] = useState(defaultPartner);
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<ApiKeyItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!partnerId) {
      setError("partner_id is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setRows(await fetchApiKeys(partnerId));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setError("");
    setNewKey("");
    try {
      const out = await createApiKey({ partner_id: Number(partnerId), label: label || undefined });
      setNewKey(out.key);
      setLabel("");
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this key?")) return;
    try {
      await revokeApiKey(id);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Partner API Keys" subtitle="Admin: issue, list and revoke partner keys" icon={KeyRound} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      {newKey && (
        <Card className="mb-3 border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">Copy this key now — it is shown only once:</p>
          <p className="mt-1 break-all font-mono text-sm">{newKey}</p>
        </Card>
      )}
      <Card className="mb-3 flex flex-wrap items-end gap-2 p-4">
        <div><Label>Partner ID *</Label><Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} /></div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>List keys</Button>
        <div><Label>Label for new key</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="prod server" /></div>
        <Button size="sm" onClick={create} disabled={!partnerId}>Issue key</Button>
      </Card>
      {rows.length === 0 ? <EmptyState message="No keys listed. Enter a partner ID and list." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Prefix</th><th className="px-3 py-2">Label</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Last used</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {rows.map((k) => (
                <tr key={k.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{k.id}</td>
                  <td className="px-3 py-2 font-mono text-xs">{k.key_prefix}…</td>
                  <td className="px-3 py-2">{k.label ?? "—"}</td>
                  <td className="px-3 py-2"><Badge tone={k.is_active ? "green" : "zinc"}>{k.is_active ? "active" : "revoked"}</Badge></td>
                  <td className="px-3 py-2">{k.last_used_at ?? "—"}</td>
                  <td className="px-3 py-2 text-right">{k.is_active && <Button size="sm" variant="destructive" onClick={() => revoke(k.id)}>Revoke</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
