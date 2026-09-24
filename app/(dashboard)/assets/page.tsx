"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox } from "@/components/page";
import { fetchAssets } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function AssetsPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [partnerId, setPartnerId] = useState(defaultPartner);
  const [assetType, setAssetType] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    setResult("");
    try {
      const out = await fn();
      const data = (out as { data?: unknown })?.data ?? out;
      setResult(JSON.stringify(data, null, 2).slice(0, 4000));
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader title="Assets" subtitle="Call assets (list)" icon={Activity} />
      {error && <div className="mb-3"><ErrorBox message={error} /></div>}
      <Card className="mb-3 grid gap-2 p-4 md:grid-cols-2">
        <div><Label>Partner ID</Label><Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} /></div>
        <div><Label>Asset type</Label><Input value={assetType} onChange={(e) => setAssetType(e.target.value)} placeholder="prompt_audio" /></div>
      </Card>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => run(() => fetchAssets({ partner_id: partnerId, asset_type: assetType }))}>List call assets</Button>
      </div>
      {result && <Card className="p-4"><pre className="max-h-96 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-100">{result}</pre></Card>}
    </div>
  );
}
