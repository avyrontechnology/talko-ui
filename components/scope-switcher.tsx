"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { fetchPartnerConfigs } from "@/lib/services";

/**
 * Superadmin cross-partner scope switcher (topbar).
 * Sets X-Partner-Scope for subsequent API calls; backend honors it for
 * ADMIN-role JWTs only. Roster suggestions come from partner configs.
 */
export function ScopeSwitcher() {
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const scopedPartnerId = useAuthStore((s) => s.scopedPartnerId);
  const setScope = useAuthStore((s) => s.setScope);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [roster, setRoster] = useState<number[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSuperadmin || !open || roster.length) return;
    fetchPartnerConfigs()
      .then((configs) => {
        const ids = Array.from(
          new Set(
            configs
              .map((c) => Number(c.partner_id))
              .filter((n) => Number.isFinite(n)),
          ),
        ).sort((a, b) => a - b);
        setRoster(ids);
      })
      .catch(() => setError("Couldn't load partner roster"));
  }, [isSuperadmin, open, roster.length]);

  const suggestions = useMemo(() => {
    const q = input.trim();
    if (!q) return roster;
    return roster.filter((id) => String(id).includes(q));
  }, [input, roster]);

  if (!isSuperadmin) return null;

  const apply = (id: string) => {
    const clean = id.trim();
    if (!/^\d+$/.test(clean)) {
      setError("Partner ID must be numeric");
      return;
    }
    setError("");
    setScope(clean);
    setOpen(false);
  };

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        title={scopedPartnerId ? `Scoped to partner ${scopedPartnerId} — click to change` : "Superadmin: click to scope a partner"}
        onClick={() => {
          setInput(scopedPartnerId ?? "");
          setError("");
          setOpen((v) => !v);
        }}
        className="flex items-center gap-1.5 rounded-full bg-ember px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer"
      >
        <ShieldCheck size={13} />
        {scopedPartnerId ? `Scope ${scopedPartnerId}` : "Superadmin"}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-lg border border-navy/10 bg-white p-3 shadow-pop">
          <p className="text-[11px] font-semibold text-slate/70">
            Act as partner (DIDs, configs follow this scope)
          </p>
          <div className="mt-2 flex gap-1.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply(input);
              }}
              placeholder="Partner ID, e.g. 2"
              className="h-8 w-full rounded-md border border-navy/15 px-2 text-sm outline-none focus:border-ember"
            />
            {scopedPartnerId && (
              <button
                type="button"
                title="Clear scope (own partner)"
                onClick={() => {
                  setScope(null);
                  setOpen(false);
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-navy/15 text-slate hover:text-brick cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => apply(input)}
            className="mt-2 h-8 w-full rounded-md bg-navy text-xs font-bold text-honey cursor-pointer"
          >
            Apply scope
          </button>
          {suggestions.length > 0 && (
            <div className="mt-2 flex max-h-32 flex-wrap gap-1 overflow-auto">
              {suggestions.slice(0, 12).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => apply(String(id))}
                  className="rounded-full border border-navy/15 px-2 py-0.5 font-mono text-[11px] text-navy hover:border-ember cursor-pointer"
                >
                  {id}
                </button>
              ))}
            </div>
          )}
          {error && <p className="mt-2 text-[11px] font-medium text-brick">{error}</p>}
        </div>
      )}
    </div>
  );
}
