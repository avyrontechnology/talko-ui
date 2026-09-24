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
  const scopedPartnerId = useAuthStore((s) => s.scopedPartnerId);
  const [rows, setRows] = useState<ClientItem[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", contact_name: "", email: "", phone: "", external_ref: "", notes: "", tags: "" });

  // No Partner ID field on this page by design: partner users are bound to
  // their own scope, superadmins use the global topbar scope switcher.
  // Empty scope + superadmin = all clients.
  const effectivePartner = (scopedPartnerId ?? "").trim() || String(defaultPartner ?? "").trim();

  const load = async (override?: string) => {
    setError("");
    const pid = override ?? effectivePartner;
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
      // Superadmin default: all clients (or scoped partner) on mount/scope change.
      void load(effectivePartner);
    } else if (defaultPartner) {
      // Partner scope: own clients.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void load(String(defaultPartner));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperadmin, scopedPartnerId]);

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
    if (!owner) {
      setError("Set a partner scope in the topbar to create a client");
      return;
    }
    if (!form.name.trim()) {
      setError("Client name is required");
      return;
    }
    const tags = form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await act(
      () =>
        createClient({
          partner_id: Number(owner),
          name: form.name.trim(),
          ...(form.contact_name.trim() ? { contact_name: form.contact_name.trim() } : {}),
          ...(form.email.trim() ? { email: form.email.trim() } : {}),
          ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
          ...(form.external_ref.trim() ? { external_ref: form.external_ref.trim() } : {}),
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
          ...(tags.length ? { tags } : {}),
        }),
      "Client created",
    );
    setForm({ name: "", contact_name: "", email: "", phone: "", external_ref: "", notes: "", tags: "" });
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
        {isSuperadmin && (
          <p className="mb-2 text-xs text-zinc-500">
            {effectivePartner
              ? `Scoped to partner ${effectivePartner} (change in the topbar scope switcher).`
              : "Showing all partners. Set a topbar scope to filter, or to create a client under one partner."}
          </p>
        )}
        <div className="grid gap-2 md:grid-cols-3">
          <div>
            <Label>Client name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" />
          </div>
          <div>
            <Label>Contact name</Label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Aarav" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="ops@acme.com" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="9876543210" />
          </div>
          <div>
            <Label>External ref (Maglo/CRM)</Label>
            <Input value={form.external_ref} onChange={(e) => setForm({ ...form, external_ref: e.target.value })} placeholder="MAG-123" />
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="vip, retail" />
          </div>
        </div>
        <div className="mt-2">
          <Label>Notes</Label>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ops context…" />
        </div>
        <Button size="sm" className="mt-2" onClick={create}>
          Create client{effectivePartner ? ` for partner ${effectivePartner}` : ""}
        </Button>
      </Card>

      {loading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : rows.length === 0 ? (
        <EmptyState message={isSuperadmin && !effectivePartner ? "No clients yet." : "No clients for this partner."} hint="Create the first client above." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <th className="px-3 py-2">Name</th>
                {isSuperadmin && <th className="px-3 py-2">Partner</th>}
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <p className="font-medium">{c.name}</p>
                    {(c.external_ref || (c.tags ?? []).length > 0) && (
                      <p className="font-mono text-xs text-zinc-500">
                        {[c.external_ref, (c.tags ?? []).join(", ")].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {c.notes && <p className="max-w-xs truncate text-xs text-zinc-500" title={c.notes}>{c.notes}</p>}
                  </td>
                  {isSuperadmin && <td className="px-3 py-2 font-mono text-xs">{c.partner_id}</td>}
                  <td className="px-3 py-2 text-xs">
                    {[c.contact_name, c.phone, c.email].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={c.is_active ? "green" : "zinc"}>
                      {c.is_active ? "active" : "inactive"}
                    </Badge>
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
