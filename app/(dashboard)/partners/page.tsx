"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2, Copy } from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { PageHeader, ErrorBox } from "@/components/page";
import {
  createApiKey,
  createPartnerConfig,
  createTalkoUser,
  fetchTalkoUsers,
  fetchVendorConfigs,
  fetchVendors,
  updateTalkoUser,
  type TalkoUser,
} from "@/lib/services";
import { apiErrorMessage } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth-store";
import type { Vendor, VendorConfig } from "@/lib/types";

type Step = 1 | 2 | 3;

export default function PartnersPage() {
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const setScope = useAuthStore((s) => s.setScope);
  const [step, setStep] = useState<Step>(1);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorConfigs, setVendorConfigs] = useState<VendorConfig[]>([]);
  const [form, setForm] = useState({
    partner_id: "",
    vendor_id: "",
    vendor_config_id: "",
    ai_vendor_config_id: "",
    service_board_ids: "",
    enable_round_robin: false,
    enable_agent_mapping: false,
    enable_service_board: false,
    dialer_enabled: false,
  });
  const [keyLabel, setKeyLabel] = useState("onboarding");
  const [createdPartnerId, setCreatedPartnerId] = useState<number | null>(null);
  const [newKey, setNewKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [users, setUsers] = useState<TalkoUser[]>([]);
  const [usersError, setUsersError] = useState("");
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("viewer");
  const [editPartner, setEditPartner] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUser, setAddUser] = useState({ name: "", email: "", phone: "", password: "", role: "viewer", partner_id: "" });
  const [provisioned, setProvisioned] = useState<{ email: string; password: string; role: string; partner: string } | null>(null);

  useEffect(() => {
    if (isSuperadmin !== true) return;
    fetchVendors().then(setVendors).catch(() => {});
    fetchVendorConfigs().then(setVendorConfigs).catch(() => {});
    loadUsers();
  }, [isSuperadmin]);

  const loadUsers = async () => {
    setUsersError("");
    try {
      setUsers(await fetchTalkoUsers());
    } catch (e) {
      setUsersError(apiErrorMessage(e));
    }
  };

  const provisionUser = async () => {
    setUsersError("");
    if (!addUser.name.trim() || !addUser.email.trim() || !addUser.password) {
      setUsersError("Name, email and password are required");
      return;
    }
    const pid = addUser.partner_id.trim() ? Number(addUser.partner_id.trim()) : null;
    if (addUser.partner_id.trim() && !Number.isFinite(pid)) {
      setUsersError("Partner ID must be numeric");
      return;
    }
    if (addUser.role !== "superadmin" && pid == null) {
      setUsersError("Non-superadmin users need a partner ID");
      return;
    }
    try {
      const created = await createTalkoUser({
        name: addUser.name.trim(),
        email: addUser.email.trim(),
        ...(addUser.phone.trim() ? { phone: addUser.phone.trim() } : {}),
        password: addUser.password,
        role: addUser.role,
        partner_id: pid,
      });
      setProvisioned({
        email: created.email,
        password: addUser.password,
        role: created.role,
        partner: created.partner_id == null ? "all" : String(created.partner_id),
      });
      setAddUser({ name: "", email: "", phone: "", password: "", role: "viewer", partner_id: "" });
      setShowAddUser(false);
      await loadUsers();
    } catch (e) {
      setUsersError(apiErrorMessage(e));
    }
  };

  const saveUser = async (id: string) => {    setUsersError("");
    try {
      await updateTalkoUser(id, {
        role: editRole,
        partner_id: editPartner.trim() ? Number(editPartner.trim()) : null,
        is_active: editActive,
      });
      setEditingUser(null);
      await loadUsers();
    } catch (e) {
      setUsersError(apiErrorMessage(e));
    }
  };

  if (isSuperadmin === false) {
    return (
      <div>
        <PageHeader title="Partners" subtitle="Onboard and manage partners" icon={Building2} />
        <Card className="mt-4 p-6 text-sm text-slate/70">
          Partner onboarding is limited to superadmins. Sign in with an ADMIN-role console account.
        </Card>
      </div>
    );
  }

  const filteredConfigs = vendorConfigs.filter(
    (c) => !form.vendor_id || c.vendor_id === form.vendor_id,
  );

  const create = async () => {
    setError("");
    const pid = Number(form.partner_id);
    if (!Number.isFinite(pid) || !form.vendor_id || !form.vendor_config_id) {
      setError("Partner ID, vendor and vendor config are required");
      return;
    }
    setBusy(true);
    try {
      await createPartnerConfig({
        partner_id: pid,
        vendor_id: form.vendor_id,
        vendor_config_id: form.vendor_config_id,
        ...(form.ai_vendor_config_id ? { ai_vendor_config_id: form.ai_vendor_config_id } : {}),
        enable_round_robin: form.enable_round_robin,
        enable_agent_mapping: form.enable_agent_mapping,
        enable_service_board: form.enable_service_board,
        dialer_enabled: form.dialer_enabled,
        service_board_ids: form.service_board_ids
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isFinite(n)),
      });
      setCreatedPartnerId(pid);
      setScope(String(pid));
      setStep(2);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const issueKey = async () => {
    if (createdPartnerId == null) return;
    setError("");
    setBusy(true);
    try {
      const out = await createApiKey({ partner_id: createdPartnerId, label: keyLabel || undefined });
      setNewKey(out.key);
      setStep(3);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const flag = (key: "enable_round_robin" | "enable_agent_mapping" | "enable_service_board" | "dialer_enabled") => (
    <label className="flex items-center gap-2 text-[13px] text-navy">
      <input
        type="checkbox"
        checked={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
        className="h-4 w-4 accent-[#f74737]"
      />
      {key.replace(/_/g, " ")}
    </label>
  );

  return (
    <div>
      <PageHeader
        title="Partners"
        subtitle="Onboard a partner: vendor wiring, API key, then DIDs"
        icon={Building2}
        actions={step > 1 && createdPartnerId != null ? <Badge>Partner {createdPartnerId}</Badge> : undefined}
      />
      <ErrorBox message={error} />

      <div className="mb-4 flex items-center gap-2 text-xs font-bold">
        {(["Config", "API key", "DIDs"] as const).map((label, i) => (
          <span key={label} className="flex items-center gap-2">
            <span
              className={
                step > i + 1
                  ? "flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                  : step === i + 1
                    ? "flex h-6 w-6 items-center justify-center rounded-full bg-ember text-white"
                    : "flex h-6 w-6 items-center justify-center rounded-full bg-navy/10 text-slate"
              }
            >
              {step > i + 1 ? <CheckCircle2 size={14} /> : i + 1}
            </span>
            <span className="text-navy">{label}</span>
            {i < 2 && <span className="h-px w-8 bg-navy/15" />}
          </span>
        ))}
      </div>

      {step === 1 && (
        <Card className="max-w-2xl space-y-3.5 p-6">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <Label>Partner ID (console)</Label>
              <Input value={form.partner_id} onChange={(e) => setForm({ ...form, partner_id: e.target.value })} placeholder="e.g. 9" className="h-10" />
            </div>
            <div>
              <Label>Service board IDs (CSV)</Label>
              <Input value={form.service_board_ids} onChange={(e) => setForm({ ...form, service_board_ids: e.target.value })} placeholder="6" className="h-10" />
            </div>
            <div>
              <Label>Vendor</Label>
              <select
                value={form.vendor_id}
                onChange={(e) => setForm({ ...form, vendor_id: e.target.value, vendor_config_id: "" })}
                className="h-10 w-full rounded-lg border border-navy/15 bg-white px-2 text-sm outline-none focus:border-ember"
              >
                <option value="">Select vendor…</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name ?? v.id}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Vendor config</Label>
              <select
                value={form.vendor_config_id}
                onChange={(e) => setForm({ ...form, vendor_config_id: e.target.value })}
                className="h-10 w-full rounded-lg border border-navy/15 bg-white px-2 text-sm outline-none focus:border-ember"
              >
                <option value="">Select config…</option>
                {filteredConfigs.map((c) => (
                  <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>AI vendor config ID (optional)</Label>
            <Input value={form.ai_vendor_config_id} onChange={(e) => setForm({ ...form, ai_vendor_config_id: e.target.value })} placeholder="TataTele-6 style id" className="h-10 font-mono" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {flag("enable_round_robin")}
            {flag("enable_agent_mapping")}
            {flag("enable_service_board")}
            {flag("dialer_enabled")}
          </div>
          <Button onClick={create} disabled={busy} size="lg" className="font-bold">
            Create partner config
          </Button>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-2xl space-y-3.5 p-6">
          <p className="text-sm text-slate/80">
            Config created for partner <span className="font-bold text-navy">{createdPartnerId}</span> (scope applied).
            Issue its first API key:
          </p>
          <div>
            <Label>Key label</Label>
            <Input value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} className="h-10" />
          </div>
          <Button onClick={issueKey} disabled={busy} size="lg" className="font-bold">
            Issue API key
          </Button>
        </Card>
      )}

      {step === 3 && (
        <Card className="max-w-2xl space-y-3.5 p-6">
          <p className="text-sm font-medium text-amber-800">Copy this key now — it is shown only once:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded-lg bg-navy p-3 font-mono text-sm text-honey">{newKey}</code>
            <Button
              size="sm"
              onClick={() => {
                void navigator.clipboard.writeText(newKey).then(() => setCopied(true));
              }}
            >
              {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            </Button>
          </div>
          <p className="text-sm text-slate/80">
            Partner <span className="font-bold text-navy">{createdPartnerId}</span> is onboarded and scoped.
            Next: assign DIDs.
          </p>
          <div className="flex gap-2">
            <Link href="/dids">
              <Button size="lg" className="font-bold">Assign DIDs</Button>
            </Link>
            <Link href="/partner-configs">
              <Button size="lg" variant="outline" className="font-bold">View configs</Button>
            </Link>
          </div>
        </Card>
      )}

      <div className="mb-2 mt-8 flex items-center justify-between">
        <h3 className="text-sm font-extrabold text-navy">Users & roles</h3>
        <Button size="sm" onClick={() => { setProvisioned(null); setShowAddUser((v) => !v); }}>
          {showAddUser ? "Close" : "Add user"}
        </Button>
      </div>
      {provisioned && (
        <Card className="mb-3 space-y-1.5 p-4 text-[13px]">
          <p className="font-bold text-navy">Account ready — share these credentials with the partner:</p>
          <p className="font-mono">email: {provisioned.email}</p>
          <p className="font-mono">password: {provisioned.password}</p>
          <p className="text-slate/70">role: {provisioned.role} · partner: {provisioned.partner}</p>
          <p className="text-[11px] text-slate/60">Password is shown only here — it cannot be retrieved later.</p>
        </Card>
      )}
      {showAddUser && (
        <Card className="mb-3 grid gap-3 p-4 sm:grid-cols-3">
          <div>
            <Label>Full name</Label>
            <Input value={addUser.name} onChange={(e) => setAddUser({ ...addUser, name: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label>Email (login)</Label>
            <Input value={addUser.email} onChange={(e) => setAddUser({ ...addUser, email: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={addUser.phone} onChange={(e) => setAddUser({ ...addUser, phone: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={addUser.password} onChange={(e) => setAddUser({ ...addUser, password: e.target.value })} className="h-9" />
          </div>
          <div>
            <Label>Role</Label>
            <select value={addUser.role} onChange={(e) => setAddUser({ ...addUser, role: e.target.value })} className="h-9 w-full rounded-lg border border-navy/15 bg-white px-2 text-sm outline-none">
              {["viewer", "maintainer", "superadmin"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Partner ID</Label>
            <Input value={addUser.partner_id} onChange={(e) => setAddUser({ ...addUser, partner_id: e.target.value })} placeholder="empty = all (superadmin)" className="h-9" />
          </div>
          <div className="sm:col-span-3">
            <Button size="sm" onClick={() => void provisionUser()}>Create login</Button>
          </div>
        </Card>
      )}
      <Card className="overflow-x-auto p-0">
        {usersError && <p className="p-4 text-xs font-medium text-brick">{usersError}</p>}
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-navy/10 text-[11px] uppercase tracking-wide text-slate/60">
              <th className="px-4 py-2.5">Email</th>
              <th className="px-4 py-2.5">Name</th>
              <th className="px-4 py-2.5">Role</th>
              <th className="px-4 py-2.5">Partner</th>
              <th className="px-4 py-2.5">Active</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-navy/5 last:border-0">
                <td className="px-4 py-2 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">
                  {editingUser === u.id ? (
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="h-8 rounded-md border border-navy/15 bg-white px-1 text-xs outline-none">
                      {["viewer", "maintainer", "superadmin"].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <Badge>{u.role}</Badge>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingUser === u.id ? (
                    <Input value={editPartner} onChange={(e) => setEditPartner(e.target.value)} placeholder="null = all" className="h-8 w-24" />
                  ) : (
                    <span className="font-mono text-xs">{u.partner_id ?? "all"}</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {editingUser === u.id ? (
                    <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-4 w-4 accent-[#f74737]" />
                  ) : (
                    u.is_active ? "yes" : "no"
                  )}
                </td>
                <td className="px-4 py-2 text-right">
                  {editingUser === u.id ? (
                    <span className="flex justify-end gap-1.5">
                      <Button size="sm" onClick={() => void saveUser(u.id)}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingUser(u.id);
                        setEditRole(u.role);
                        setEditPartner(u.partner_id == null ? "" : String(u.partner_id));
                        setEditActive(u.is_active);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-xs text-slate/60">No users yet — the first signup becomes superadmin.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
