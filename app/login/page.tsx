"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Fingerprint, ShieldCheck, PhoneCall, BarChart3, Plug2 } from "lucide-react";
import { Button, Card, Input, Label } from "@/components/ui";
import { useAuthStore } from "@/store/auth-store";
import { talkoConfig } from "@/lib/config";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  { icon: PhoneCall, title: "Voice operations", desc: "Place, monitor, hang up and transfer calls" },
  { icon: BarChart3, title: "CDR & analytics", desc: "Agent, board and trend intelligence" },
  { icon: Plug2, title: "Partner integrations", desc: "API keys, webhooks, DIDs and vendors" },
];

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const expired = search.get("expired");
  const [mode, setMode] = useState<"apiKey" | "jwt">("apiKey");
  const [credential, setCredential] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [error, setError] = useState("");
  const loginWithApiKey = useAuthStore((s) => s.loginWithApiKey);
  const loginWithToken = useAuthStore((s) => s.loginWithToken);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!credential.trim()) {
      setError(mode === "apiKey" ? "API key is required" : "Bearer token is required");
      return;
    }
    if (mode === "apiKey") loginWithApiKey(credential, { partnerId });
    else loginWithToken(credential, { partnerId });
    router.replace("/dashboard");
  };

  return (
    <div className="flex min-h-screen bg-mist">
      {/* Brand panel */}
      <div
        className="relative hidden w-[44%] flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{ backgroundImage: "linear-gradient(160deg, #2e3570 0%, #1f2650 45%, #10142e 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #f74737 0%, transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #f5b73d 0%, transparent 65%)" }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ember text-xl font-extrabold shadow-pop">
            T
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight">{talkoConfig.appName}</p>
            <p className="text-xs text-white/60">Enterprise voice console</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-[1.1] tracking-tight">
            Every call, <span className="text-honey">every partner</span>, one console.
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/65">
            Operate your Tata Tele voice stack — live calls, CDR intelligence, DIDs,
            dialer campaigns and partner integrations — from a single pane of glass.
          </p>
          <div className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <h.icon size={17} className="text-honey" />
                </div>
                <div>
                  <p className="text-sm font-bold">{h.title}</p>
                  <p className="text-xs text-white/60">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative font-mono text-[11px] text-white/40">
          {talkoConfig.apiBaseUrl}
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md p-7 shadow-pop">
          <div className="mb-1 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ember font-bold text-white">T</div>
            <p className="font-extrabold text-navy">{talkoConfig.appName}</p>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Welcome back</h2>
          <p className="mt-1 text-[13px] text-slate/70">Sign in with your Talko credential to continue.</p>

          {expired && (
            <p className="mt-3 rounded-lg bg-honey/15 p-2.5 text-xs font-medium text-amber-800">
              Session expired. Please sign in again.
            </p>
          )}

          <div className="mb-4 mt-5 grid grid-cols-2 gap-1 rounded-xl bg-navy/[0.07] p-1 text-sm">
            {(
              [
                { id: "apiKey", label: "API Key", icon: KeyRound },
                { id: "jwt", label: "Bearer Token", icon: Fingerprint },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMode(t.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 font-semibold cursor-pointer",
                  mode === t.id ? "bg-white text-navy shadow-sm" : "text-slate/60 hover:text-navy",
                )}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div>
              <Label>{mode === "apiKey" ? "API Key  ·  sent as API-KEY header" : "JWT  ·  sent as Authorization: Bearer"}</Label>
              <Input
                type="password"
                autoComplete="off"
                placeholder={mode === "apiKey" ? "tkp_live_…" : "eyJ…"}
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="h-10 font-mono"
              />
            </div>
            <div>
              <Label>Partner ID <span className="font-normal text-slate/60">(default filter scope)</span></Label>
              <Input placeholder="e.g. 2" value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className="h-10" />
            </div>
            {error && <p className="text-xs font-medium text-brick">{error}</p>}
            <Button type="submit" size="lg" className="w-full font-bold">
              Sign in to console
            </Button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-lg bg-mist p-3 text-[11px] leading-relaxed text-slate/80">
            <ShieldCheck size={15} className="mt-px shrink-0 text-navy" />
            <p>
              Credentials never leave your browser except as request headers to{" "}
              <code className="font-mono text-navy">{talkoConfig.apiBaseUrl}</code>.
              Manage keys under <span className="font-semibold">API Keys</span> once signed in.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
