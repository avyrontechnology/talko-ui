"use client";

import { useState } from "react";
import { Plug2 } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import {
  createWebhookConfig,
  fetchWebhookConfig,
  fetchWebhookDeliveries,
  updateWebhookConfig,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { WebhookConfig, WebhookDelivery } from "@/lib/types";

export default function WebhooksPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [partnerId, setPartnerId] = useState(defaultPartner);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState("");
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
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
      const [c, d] = await Promise.all([
        fetchWebhookConfig(partnerId),
        fetchWebhookDeliveries({ partner_id: partnerId, limit: 20 }),
      ]);
      setConfig(c);
      setDeliveries(Array.isArray(d) ? d : []);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setError("");
    try {
      const c = await createWebhookConfig({
        partner_id: Number(partnerId),
        url,
        subscribed_events: events.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setConfig(c);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const toggle = async () => {
    if (!config) return;
    try {
      const c = await updateWebhookConfig(partnerId, { is_active: !config.is_active });
      setConfig(c);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Partner Webhooks" subtitle="Delivery configs and attempt logs" icon={Plug2} actions={<Button size="sm" variant="outline" onClick={load} disabled={loading}>Load</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 flex flex-wrap items-end gap-2 p-4">
        <div><Label>Partner ID *</Label><Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} /></div>
        <div className="min-w-64 flex-1"><Label>Webhook URL</Label><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://partner.example/webhooks/talko" /></div>
        <div><Label>Events (comma separated)</Label><Input value={events} onChange={(e) => setEvents(e.target.value)} placeholder="call.completed, call.started" /></div>
        <Button size="sm" onClick={create} disabled={!partnerId || !url}>Save config</Button>
      </Card>
      {config && (
        <Card className="mb-3 flex flex-wrap items-center gap-2 p-4 text-sm">
          <Badge tone={config.is_active ? "green" : "zinc"}>{config.is_active ? "active" : "paused"}</Badge>
          <span className="font-mono text-xs">{config.url}</span>
          <span className="text-zinc-500">{(config.subscribed_events ?? []).join(", ") || "all events"}</span>
          <Button size="sm" variant="outline" onClick={toggle}>{config.is_active ? "Pause" : "Resume"}</Button>
        </Card>
      )}
      <h2 className="mb-2 font-medium">Recent deliveries</h2>
      {deliveries.length === 0 ? <EmptyState message="No delivery attempts." /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b bg-zinc-50 text-left text-xs uppercase text-zinc-500"><th className="px-3 py-2">Time</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Attempt</th><th className="px-3 py-2">HTTP</th><th className="px-3 py-2">OK</th><th className="px-3 py-2">Error</th></tr></thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="px-3 py-2 text-xs">{String(d.created_at ?? "—")}</td>
                  <td className="px-3 py-2 font-mono text-xs">{d.event_type}</td>
                  <td className="px-3 py-2">#{d.attempt_number}</td>
                  <td className="px-3 py-2">{d.status_code ?? "—"}</td>
                  <td className="px-3 py-2"><Badge tone={d.success ? "green" : "red"}>{d.success ? "yes" : "no"}</Badge></td>
                  <td className="px-3 py-2 text-xs text-zinc-500">{d.error ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
