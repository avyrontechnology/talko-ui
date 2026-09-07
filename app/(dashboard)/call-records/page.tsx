"use client";

import { useEffect, useState } from "react";
import { BookUser } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import {
  createCallRecord,
  deleteCallRecord,
  fetchCallRecords,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { CallRecord } from "@/lib/types";

export default function CallRecordsPage() {
  const [rows, setRows] = useState<CallRecord[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ caller: "", receiver: "", duration: "", timestamp: "" });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchCallRecords());
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
      await createCallRecord({
        caller: form.caller,
        receiver: form.receiver,
        duration: Number(form.duration),
        timestamp: form.timestamp ? new Date(form.timestamp).toISOString() : new Date().toISOString(),
      });
      setForm({ caller: "", receiver: "", duration: "", timestamp: "" });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await deleteCallRecord(id);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Call Records" subtitle="POST/GET/PUT/DELETE /call-record(s)" icon={BookUser} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 p-4">
        <h2 className="mb-2 font-medium">Create record</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <div><Label>Caller</Label><Input value={form.caller} onChange={(e) => setForm({ ...form, caller: e.target.value })} /></div>
          <div><Label>Receiver</Label><Input value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} /></div>
          <div><Label>Duration (s)</Label><Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
          <div><Label>Timestamp</Label><Input type="datetime-local" value={form.timestamp} onChange={(e) => setForm({ ...form, timestamp: e.target.value })} /></div>
        </div>
        <Button size="sm" className="mt-3" onClick={create} disabled={!form.caller || !form.receiver || !form.duration}>Create</Button>
      </Card>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rows.length === 0 ? <EmptyState message="No call records." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">ID</th><th className="px-3 py-2">Caller</th><th className="px-3 py-2">Receiver</th><th className="px-3 py-2">Duration</th><th className="px-3 py-2">Timestamp</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {rows.map((r, i) => {
                const id = String(r.record_id ?? r.id ?? i);
                return (
                  <tr key={id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{id}</td>
                    <td className="px-3 py-2">{r.caller}</td>
                    <td className="px-3 py-2">{r.receiver}</td>
                    <td className="px-3 py-2">{r.duration}s</td>
                    <td className="px-3 py-2">{String(r.timestamp)}</td>
                    <td className="px-3 py-2 text-right"><Button size="sm" variant="destructive" onClick={() => remove(id)}>Delete</Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
