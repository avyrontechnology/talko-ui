"use client";

import { useEffect, useState } from "react";
import { Tags } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { createCustomField, deleteCustomField, fetchCustomFields, updateCustomField } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { CustomField } from "@/lib/types";

export default function CustomFieldsPage() {
  const [rows, setRows] = useState<CustomField[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ field_name: "", data_type: "string", choice_options: "", is_required: false });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await fetchCustomFields());
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
      await createCustomField({
        entity_type: "TalkoCDR",
        field_name: form.field_name,
        data_type: form.data_type,
        choice_options: form.data_type === "choice" ? form.choice_options.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        is_required: form.is_required,
      });
      setForm({ field_name: "", data_type: "string", choice_options: "", is_required: false });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const toggleActive = async (f: CustomField) => {
    try {
      await updateCustomField(f.id, { is_active: !f.is_active });
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this field?")) return;
    try {
      await deleteCustomField(id);
      await load();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Custom Fields" subtitle="POST/GET/PATCH/DELETE /custom-fields" icon={Tags} actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 flex flex-wrap items-end gap-2 p-4">
        <div><Label>Field name *</Label><Input value={form.field_name} onChange={(e) => setForm({ ...form, field_name: e.target.value })} placeholder="Disposition reason" /></div>
        <div><Label>Data type</Label><Select value={form.data_type} onChange={(e) => setForm({ ...form, data_type: e.target.value })}><option value="string">string</option><option value="number">number</option><option value="date">date</option><option value="boolean">boolean</option><option value="choice">choice</option></Select></div>
        {form.data_type === "choice" && <div><Label>Options (comma separated)</Label><Input value={form.choice_options} onChange={(e) => setForm({ ...form, choice_options: e.target.value })} /></div>}
        <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} /> required</label>
        <Button size="sm" onClick={create} disabled={!form.field_name.trim()}>Create</Button>
      </Card>
      {loading ? <p className="text-sm text-zinc-500">Loading…</p> : rows.length === 0 ? <EmptyState message="No custom fields." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">Slug</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Required</th><th className="px-3 py-2">Active</th><th className="px-3 py-2"></th></tr></thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{f.field_slug}</td>
                  <td className="px-3 py-2">{f.field_name}</td>
                  <td className="px-3 py-2"><Badge tone="zinc">{f.data_type}</Badge></td>
                  <td className="px-3 py-2">{f.is_required ? "yes" : "no"}</td>
                  <td className="px-3 py-2"><Badge tone={f.is_active ? "green" : "zinc"}>{f.is_active ? "active" : "inactive"}</Badge></td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => toggleActive(f)}>{f.is_active ? "Disable" : "Enable"}</Button>
                      <Button size="sm" variant="destructive" onClick={() => remove(f.id)}>Delete</Button>
                    </div>
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
