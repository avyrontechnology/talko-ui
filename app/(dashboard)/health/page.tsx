"use client";

import { useState } from "react";
import { HeartPulse } from "lucide-react";
import { Badge, Button, Card, Textarea } from "@/components/ui";
import { PageHeader, ErrorBox } from "@/components/page";
import { fetchHealth } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import type { HealthResponse } from "@/lib/types";

export default function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const check = async () => {
    setLoading(true);
    setError("");
    try {
      setHealth(await fetchHealth());
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Health" subtitle="GET /health — public, no auth required" icon={HeartPulse} actions={<Button size="sm" onClick={check} disabled={loading}>{loading ? "Checking…" : "Check now"}</Button>} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      {!health ? (
        <Card className="p-8 text-center text-sm text-zinc-500">Run a health check to see service status.</Card>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={health.status === "healthy" ? "green" : health.status === "degraded" ? "amber" : "red"}>{health.status}</Badge>
            {health.service && <Badge tone="zinc">{health.service}</Badge>}
            {health.environment && <Badge tone="zinc">{health.environment}</Badge>}
          </div>
          <Card className="p-4">
            <Textarea readOnly rows={16} value={JSON.stringify(health, null, 2)} className="font-mono text-xs" />
          </Card>
        </>
      )}
    </div>
  );
}
