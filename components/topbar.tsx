"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Command, Search } from "lucide-react";
import { talkoConfig } from "@/lib/config";
import { useAuthStore } from "@/store/auth-store";
import { ScopeSwitcher } from "./scope-switcher";
import { NAV_INDEX } from "./sidebar";

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function Topbar() {
  const pathname = usePathname();
  const partnerId = useAuthStore((s) => s.partnerId);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const crumbs = useMemo(() => {
    const seg = pathname.split("/").filter(Boolean);
    return seg.length ? seg : ["dashboard"];
  }, [pathname]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_INDEX.filter(
      (n) => n.label.toLowerCase().includes(q) || n.blurb.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-navy/10 bg-white/85 px-5 backdrop-blur">
      {/* Breadcrumb */}
      <nav className="flex min-w-0 items-center gap-1 text-sm">
        <span className="hidden font-semibold text-navy sm:inline">Console</span>
        {crumbs.map((c) => (
          <span key={c} className="flex items-center gap-1">
            <ChevronRight size={14} className="text-zinc-400" />
            <span className="font-medium capitalize text-slate">{c.replace(/-/g, " ")}</span>
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Quick jump */}
      <div className="relative hidden md:block">
        <div className="flex items-center gap-2 rounded-lg border border-navy/15 bg-mist px-2.5 py-1.5 text-sm text-slate focus-within:border-ember">
          <Search size={15} className="shrink-0 text-slate/60" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Jump to…"
            className="w-40 bg-transparent outline-none placeholder:text-slate/50"
          />
          <kbd className="flex items-center gap-0.5 rounded border border-navy/15 bg-white px-1 text-[10px] text-slate/60">
            <Command size={10} />K
          </kbd>
        </div>
        {open && results.length > 0 && (
          <div className="absolute right-0 top-full mt-1.5 w-72 overflow-hidden rounded-lg border border-navy/10 bg-white shadow-pop">
            {results.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-mist"
              >
                <r.icon size={15} className="shrink-0 text-ember" />
                <span>
                  <span className="block text-[13px] font-semibold text-navy">{r.label}</span>
                  <span className="block text-[11px] text-slate/70">{r.blurb}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Context chips */}
      <div className="hidden items-center gap-2 lg:flex">
        <span
          title={talkoConfig.apiBaseUrl}
          className="rounded-full border border-navy/15 bg-mist px-2.5 py-1 font-mono text-[11px] text-slate"
        >
          {hostOf(talkoConfig.apiBaseUrl)}
        </span>
        {partnerId && (
          <span className="rounded-full bg-navy px-2.5 py-1 text-[11px] font-bold text-honey">
            Partner {partnerId}
          </span>
        )}
        <ScopeSwitcher />
      </div>

      <button
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-navy/15 bg-white text-slate hover:text-ember cursor-pointer"
      >
        <Bell size={17} />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-ember ring-2 ring-white" />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-extrabold text-honey">
        {(partnerId || "T").toString().slice(0, 1).toUpperCase()}
      </div>
    </header>
  );
}
