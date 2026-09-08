"use client";

import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox } from "@/components/page";
import { createCall, hangupCall, transferCall, fetchCallDetails } from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";

export default function CallsPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [create, setCreate] = useState({
    entity_type: "Lead",
    entity_id: "",
    service_board_id: "",
    agent_number: "",
    to_number: "",
    partner_id: defaultPartner,
    enable_ai_bridge: false,
    dedicated_did: "",
    voiceai_agent_id: "",
  });
  const [callId, setCallId] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [detailId, setDetailId] = useState("");
  const [vendorConfigId, setVendorConfigId] = useState("");

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const out = await fn();
      setResult(JSON.stringify(out, null, 2));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Calls" subtitle="POST /call · /call/hangup · /call/transfer · GET /call/details" icon={PhoneCall} />
      {error && (
        <div className="mb-3">
          <ErrorBox message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 font-medium">Initiate call</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Entity type</Label>
              <Select
                value={create.entity_type}
                onChange={(e) => setCreate({ ...create, entity_type: e.target.value })}
              >
                <option value="Lead">Lead</option>
                <option value="Contact">Contact</option>
              </Select>
            </div>
            <div>
              <Label>Entity ID</Label>
              <Input value={create.entity_id} onChange={(e) => setCreate({ ...create, entity_id: e.target.value })} placeholder="entity_123" />
            </div>
            <div>
              <Label>Service board ID</Label>
              <Input value={create.service_board_id} onChange={(e) => setCreate({ ...create, service_board_id: e.target.value })} placeholder="12" />
            </div>
            <div>
              <Label>Partner ID</Label>
              <Input value={create.partner_id} onChange={(e) => setCreate({ ...create, partner_id: e.target.value })} placeholder="2" />
            </div>
            <div>
              <Label>Agent number</Label>
              <Input value={create.agent_number} onChange={(e) => setCreate({ ...create, agent_number: e.target.value })} placeholder="91…" />
            </div>
            <div>
              <Label>To number</Label>
              <Input value={create.to_number} onChange={(e) => setCreate({ ...create, to_number: e.target.value })} placeholder="91…" />
            </div>
            <div className="col-span-2 flex items-center gap-2 rounded-md bg-mist px-3 py-2">
              <input
                id="ai-bridge"
                type="checkbox"
                checked={create.enable_ai_bridge}
                onChange={(e) => setCreate({ ...create, enable_ai_bridge: e.target.checked })}
              />
              <Label htmlFor="ai-bridge" className="!mb-0">AI bridge — route to voiceai agent on answer</Label>
            </div>
            {create.enable_ai_bridge && (
              <>
                <div>
                  <Label>Dedicated DID *</Label>
                  <Input value={create.dedicated_did} onChange={(e) => setCreate({ ...create, dedicated_did: e.target.value })} placeholder="91804…" />
                </div>
                <div>
                  <Label>voiceai agent ID *</Label>
                  <Input value={create.voiceai_agent_id} onChange={(e) => setCreate({ ...create, voiceai_agent_id: e.target.value })} placeholder="agent_abc" />
                </div>
              </>
            )}
          </div>
          <Button
            className="mt-3"
            disabled={busy || (create.enable_ai_bridge && (!create.dedicated_did || !create.voiceai_agent_id))}
            onClick={() =>
              run(() =>
                createCall({
                  entity_type: create.entity_type as "Lead" | "Contact",
                  entity_id: create.entity_id || undefined,
                  service_board_id: create.service_board_id ? Number(create.service_board_id) : undefined,
                  partner_id: create.partner_id ? Number(create.partner_id) : undefined,
                  agent_number: create.enable_ai_bridge ? undefined : create.agent_number || undefined,
                  to_number: create.to_number || undefined,
                  enable_ai_bridge: create.enable_ai_bridge || undefined,
                  dedicated_did: create.enable_ai_bridge ? create.dedicated_did || undefined : undefined,
                  context_data: create.enable_ai_bridge && create.voiceai_agent_id
                    ? { voiceai_agent_id: create.voiceai_agent_id }
                    : undefined,
                }),
              )
            }
          >
            {create.enable_ai_bridge ? "Initiate AI call" : "Initiate"}
          </Button>
        </Card>

        <div className="space-y-3">
          <Card className="p-4">
            <h2 className="mb-3 font-medium">Hangup / Transfer</h2>
            <Label>Call ID</Label>
            <Input value={callId} onChange={(e) => setCallId(e.target.value)} placeholder="call_id" />
            <div className="mt-2 flex gap-2">
              <Button variant="outline" disabled={busy || !callId} onClick={() => run(() => hangupCall({ call_id: callId }))}>
                Hangup
              </Button>
            </div>
            <div className="mt-3">
              <Label>Transfer destination</Label>
              <div className="flex gap-2">
                <Input value={transferTo} onChange={(e) => setTransferTo(e.target.value)} placeholder="91…" />
                <Button
                  variant="outline"
                  disabled={busy || !callId || !transferTo}
                  onClick={() => run(() => transferCall({ call_id: callId, destination_number: transferTo }))}
                >
                  Transfer
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 font-medium">Live call details</h2>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Call UUID / ID</Label>
                <Input value={detailId} onChange={(e) => setDetailId(e.target.value)} placeholder="call_uuid" />
              </div>
              <div>
                <Label>Vendor config ID *</Label>
                <Input value={vendorConfigId} onChange={(e) => setVendorConfigId(e.target.value)} placeholder="vc_…" />
              </div>
            </div>
            <Button
              className="mt-3"
              variant="outline"
              disabled={busy || !vendorConfigId}
              onClick={() =>
                run(() => fetchCallDetails({ call_uuid: detailId || undefined, vendor_config_id: vendorConfigId }))
              }
            >
              Fetch details
            </Button>
          </Card>
        </div>
      </div>

      {result && (
        <Card className="mt-3 p-4">
          <h2 className="mb-2 font-medium">Response</h2>
          <pre className="max-h-96 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-100">{result}</pre>
        </Card>
      )}
    </div>
  );
}
