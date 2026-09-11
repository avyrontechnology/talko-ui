"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import {
  activateVendor,
  createVendor,
  deactivateVendor,
  fetchVendors,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { Vendor } from "@/lib/types";

export default function VendorsPage() {
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const [rows, setRows] = useState<Vendor[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [vendorType, setVendorType] = useState("tata_tele");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchVendors());
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
      await createVendor({ name, vendor_type: vendorType });
      setName("");
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const toggle = async (v: Vendor) => {
    try {
      if (v.is_active) await deactivateVendor(v.id);
      else await activateVendor(v.id);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Vendors" subtitle="POST/GET /vendors · activate / deactivate" icon={Database} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {isSuperadmin === false && (
        <Card className="mt-4 p-6 text-sm text-slate/70">
          Vendors is limited to superadmins. Sign in with a superadmin account.
        </Card>
      )}
      {isSuperadmin !== false && (<>
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 flex flex-wrap items-end gap-2 p-4">
        <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tata Tele" /></div>
        <div><Label>Vendor type</Label><Input value={vendorType} onChange={(e) => setVendorType(e.target.value)} /></div>
        <Button size="sm" onClick={create} disabled={!name.trim()}>Create</Button>
      </Card>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rows.length === 0 ? <EmptyState message="No vendors." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Status</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{v.id}</td>
                  <td className="px-3 py-2">{v.name}</td>
                  <td className="px-3 py-2">{v.vendor_type ?? "—"}</td>
                  <td className="px-3 py-2"><Badge tone={v.is_active ? "green" : "zinc"}>{v.is_active ? "active" : "inactive"}</Badge></td>
                  <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" onClick={() => toggle(v)}>{v.is_active ? "Deactivate" : "Activate"}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      </>)}
    </div>
  );
}
