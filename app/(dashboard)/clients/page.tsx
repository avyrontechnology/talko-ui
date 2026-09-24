"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { TableSkeleton } from "@/components/primitives";
import {
  activateClient,
  createClient,
  deactivateClient,
  fetchClients,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { ClientItem } from "@/lib/types";

export default function ClientsPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const [partnerId, setPartnerId] = useState(String(defaultPartner ?? ""));
  const [rows, setRows] = useState<ClientItem[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", workspace_ids: "" });

  // Effective owner: typed filter for superadmin, own scope otherwise.
  const effectivePartner = isSuperadmin ? partnerId.trim() : String(defaultPartner ?? "").trim() || partnerId.trim();

  const load = async (override?: string) => {
    setError("");
    const pid = override ?? (isSuperadmin ? partnerId.trim() : effectivePartner);
    if (!pid && !isSuperadmin) {
      setError("Partner scope missing — sign in again");
      return;
    }
    setLoading(true);
    try {
      // Empty pid + superadmin = all clients.
      setRows(await fetchClients(pid === "" ? undefined : pid));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperadmin) {
      // Superadmin default: all clients on mount.
      void load("");
    } else if (defaultPartner) {
      // Partner scope: own clients, no Partner ID needed.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load(String(defaultPartner));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperadmin]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setError("");
    setMsg("");
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const create = async () => {
    const owner = effectivePartner;
    if (!owner || !form.name.trim()) {
      setError(isSuperadmin ? "Partner ID + client name are required" : "Client name is required");
      return;
    }
    const workspace_ids = form.workspace_ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isInteger(n));
    await act(
      () =>
        createClient({
          partner_id: Number(owner),
          name: form.name.trim(),
          workspace_ids,
        }),
      "Client created",
    );
    setForm({ name: "", workspace_ids: "" });
  };

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Partner-scoped sub-accounts (Phase 7 billing hooks here)"
        icon={Building2}
        actions={
          <Button size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading…" : "Search"}
          </Button>
        }
      />
      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}
      {msg && (
        <Card className="mb-3 border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {msg}
        </Card>
      )}

      <Card className="mb-3 p-4">
        <div className={`grid gap-2 ${isSuperadmin ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
          {isSuperadmin ? (
            <div>
              <Label>Partner ID (empty = all)</Label>
              <Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} placeholder="empty = all" />
            </div>
          ) : (
            <div>
              <Label>Partner</Label>
              <Input value={effectivePartner} disabled />
            </div>
          )}
          <div>
            <Label>Client name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
          </div>
          <div>
            <Label>Workspace IDs (comma separated)</Label>
            <Input
              value={form.workspace_ids}
              onChange={(e) => setForm({ ...form, workspace_ids: e.target.value })}
              placeholder="1, 2"
            />
          </div>
        </div>
        <Button size="sm" className="mt-2" onClick={create}>
          Create client
        </Button>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState message={isSuperadmin && !partnerId.trim() ? "No clients yet." : "No clients for this partner."} hint="Create the first client above." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <th className="px-3 py-2">Name</th>
                {isSuperadmin && <th className="px-3 py-2">Partner</th>}
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Workspaces</th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  {isSuperadmin && <td className="px-3 py-2 font-mono text-xs">{c.partner_id}</td>}
                  <td className="px-3 py-2">
                    <Badge tone={c.is_active ? "green" : "zinc"}>
                      {c.is_active ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {(c.workspace_ids ?? []).join(", ") || "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-zinc-500">{c.id}</td>
                  <td className="px-3 py-2 text-right">
                    {c.is_active ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act(() => deactivateClient(c.id), `Deactivated ${c.name}`)}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => act(() => activateClient(c.id), `Activated ${c.name}`)}
                      >
                        Activate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
