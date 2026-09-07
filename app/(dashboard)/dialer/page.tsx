"use client";

import { useEffect, useState } from "react";
import { Radio } from "lucide-react";
import { Button, Card, Input, Label, Textarea } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { fetchLeadLists, uploadDialerLeads } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { LeadList } from "@/lib/types";

export default function DialerPage() {
  const [lists, setLists] = useState<LeadList[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [listId, setListId] = useState("");
  const [phones, setPhones] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchLeadLists();
      setLists(data.lists ?? []);
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

  const upload = async () => {
    setError("");
    setMsg("");
    try {
      const rows = phones.split("\n").map((p) => p.trim()).filter(Boolean).map((p) => ({ field_0: p }));
      if (!listId || rows.length === 0) {
        setError("list_id and at least one phone number are required");
        return;
      }
      await uploadDialerLeads(listId, { data: rows });
      setMsg(`Upload accepted for list ${listId} (${rows.length} leads). Check batch_status.`);
      setPhones("");
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Dialer" subtitle="GET /dialer/lead-lists · POST /dialer/lead-lists/{id}/leads" icon={Radio} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      {msg && <Card className="mb-3 border-green-200 bg-green-50 p-3 text-sm text-green-700">{msg}</Card>}
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : lists.length === 0 ? <EmptyState message="No lead lists." /> : (
        <Card className="mb-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Description</th></tr></thead>
            <tbody>
              {lists.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-zinc-50" onClick={() => setListId(l.id)} style={{ cursor: "pointer" }}>
                  <td className="px-3 py-2 font-mono text-xs">{l.id}</td>
                  <td className="px-3 py-2">{l.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{l.description ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Card className="p-4">
        <h2 className="mb-2 font-medium">Bulk upload leads</h2>
        <div className="grid gap-2 md:grid-cols-2">
          <div><Label>List ID (click a row to fill)</Label><Input value={listId} onChange={(e) => setListId(e.target.value)} /></div>
        </div>
        <div className="mt-2"><Label>Phone numbers (one per line → field_0)</Label><Textarea rows={6} value={phones} onChange={(e) => setPhones(e.target.value)} placeholder="9198…" /></div>
        <Button size="sm" className="mt-3" onClick={upload}>Upload</Button>
      </Card>
    </div>
  );
}
