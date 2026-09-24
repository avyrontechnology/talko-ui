"use client";

import { useEffect, useState } from "react";
import { ReceiptIndianRupee } from "lucide-react";
import { Badge, Button, Card, Input, Label, Select } from "@/components/ui";
import { PageHeader, ErrorBox, EmptyState } from "@/components/page";
import { TableSkeleton } from "@/components/primitives";
import {
  fetchBillingTransactions,
  fetchLedger,
  fetchRateCards,
  priceCall,
  saveRateCard,
  topupLedger,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { BillingTransaction, Ledger, RateCard } from "@/lib/types";

export default function BillingPage() {
  const defaultPartner = useAuthStore((s) => s.partnerId);
  const [partnerId, setPartnerId] = useState(String(defaultPartner ?? ""));
  const [cards, setCards] = useState<RateCard[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [txns, setTxns] = useState<BillingTransaction[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [cardForm, setCardForm] = useState({
    vendor_type: "default",
    per_min_rate: "",
    per_call_rate: "",
  });
  const [topupForm, setTopupForm] = useState({ amount: "", enforce: false });
  const [priceCallId, setPriceCallId] = useState("");

  const loadCards = async () => {
    try {
      setCards(await fetchRateCards());
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  const loadLedger = async () => {
    setError("");
    setMsg("");
    if (!partnerId.trim()) {
      setError("Partner ID is required");
      return;
    }
    setLoading(true);
    try {
      const pid = partnerId.trim();
      setLedger(await fetchLedger(pid));
      setTxns(await fetchBillingTransactions(pid));
    } catch (e) {
      setLedger(null);
      setTxns([]);
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCards();
    if (defaultPartner) void loadLedger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    setError("");
    setMsg("");
    try {
      await fn();
      setMsg(ok);
      await loadCards();
      if (partnerId.trim()) await loadLedger();
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  };

  return (
    <div>
      <PageHeader
        title="Billing"
        subtitle="Rate cards · ledgers · topups · per-call pricing"
        icon={ReceiptIndianRupee}
        actions={
          <Button size="sm" onClick={loadLedger} disabled={loading}>
            {loading ? "Loading…" : "Refresh ledger"}
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

      <div className="mb-3 grid gap-3 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-2 font-medium">Ledger lookup</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Partner ID</Label>
              <Input value={partnerId} onChange={(e) => setPartnerId(e.target.value)} placeholder="7" />
            </div>
          </div>
          {ledger ? (
            <div className="mt-3 rounded-md bg-zinc-50 p-3 font-mono text-sm">
              balance {ledger.balance} {ledger.currency}{" "}
              <Badge tone={ledger.enforce_balance ? "amber" : "zinc"}>
                {ledger.enforce_balance ? "enforced" : "not enforced"}
              </Badge>
            </div>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">No ledger loaded.</p>
          )}
          <h2 className="mb-2 mt-4 font-medium">Topup</h2>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Amount *</Label>
              <Input
                value={topupForm.amount}
                onChange={(e) => setTopupForm({ ...topupForm, amount: e.target.value })}
                placeholder="1000"
              />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input
                id="enforce"
                type="checkbox"
                checked={topupForm.enforce}
                onChange={(e) => setTopupForm({ ...topupForm, enforce: e.target.checked })}
              />
              <Label htmlFor="enforce" className="!mb-0">
                Enforce balance on calls
              </Label>
            </div>
          </div>
          <Button
            size="sm"
            className="mt-2"
            disabled={!partnerId.trim() || !topupForm.amount}
            onClick={() =>
              act(
                () =>
                  topupLedger({
                    partner_id: Number(partnerId.trim()),
                    amount: Number(topupForm.amount),
                    enforce_balance: topupForm.enforce,
                  }),
                "Topup applied",
              )
            }
          >
            Apply topup
          </Button>
          <h2 className="mb-2 mt-4 font-medium">Price a call</h2>
          <div className="flex gap-2">
            <Input
              value={priceCallId}
              onChange={(e) => setPriceCallId(e.target.value)}
              placeholder="vendor call_id"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!priceCallId.trim()}
              onClick={() => act(() => priceCall({ call_id: priceCallId.trim() }), "Call priced")}
            >
              Price
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="mb-2 font-medium">Rate cards</h2>
          {cards.length === 0 ? (
            <p className="py-2 text-sm text-zinc-500">No rate cards yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-zinc-500">
                  <th className="py-1">Vendor</th>
                  <th className="py-1 text-right">Per min</th>
                  <th className="py-1 text-right">Per call</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-1 font-mono text-xs">{c.vendor_type}</td>
                    <td className="py-1 text-right font-mono">
                      {c.per_min_rate} {c.currency}
                    </td>
                    <td className="py-1 text-right font-mono">
                      {c.per_call_rate} {c.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <h2 className="mb-2 mt-4 font-medium">Save rate card</h2>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label>Vendor</Label>
              <Select
                value={cardForm.vendor_type}
                onChange={(e) => setCardForm({ ...cardForm, vendor_type: e.target.value })}
              >
                <option value="default">default</option>
                <option value="tata_tele">tata_tele</option>
                <option value="otoba">otoba</option>
              </Select>
            </div>
            <div>
              <Label>Per min</Label>
              <Input
                value={cardForm.per_min_rate}
                onChange={(e) => setCardForm({ ...cardForm, per_min_rate: e.target.value })}
                placeholder="2.0"
              />
            </div>
            <div>
              <Label>Per call</Label>
              <Input
                value={cardForm.per_call_rate}
                onChange={(e) => setCardForm({ ...cardForm, per_call_rate: e.target.value })}
                placeholder="1.0"
              />
            </div>
          </div>
          <Button
            size="sm"
            className="mt-2"
            onClick={() =>
              act(
                () =>
                  saveRateCard({
                    vendor_type: cardForm.vendor_type,
                    per_min_rate: Number(cardForm.per_min_rate || 0),
                    per_call_rate: Number(cardForm.per_call_rate || 0),
                  }),
                "Rate card saved",
              )
            }
          >
            Save
          </Button>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-2 font-medium">Transactions</h2>
        {loading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : txns.length === 0 ? (
          <EmptyState message="No transactions." hint="Top up or price a call first." />
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-zinc-500">
                <th className="px-2 py-1">Kind</th>
                <th className="px-2 py-1 text-right">Amount</th>
                <th className="px-2 py-1">Call</th>
                <th className="px-2 py-1">Remark</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="px-2 py-1">
                    <Badge tone={t.kind === "debit" ? "amber" : "green"}>{t.kind}</Badge>
                  </td>
                  <td className="px-2 py-1 text-right font-mono">
                    {t.amount} {t.currency}
                  </td>
                  <td className="px-2 py-1 font-mono text-xs">{t.call_id ?? "—"}</td>
                  <td className="px-2 py-1 text-xs text-zinc-500">{t.remark ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
