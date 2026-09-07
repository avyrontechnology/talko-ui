"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  BarChart3,
  BookUser,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  PhoneCall,
  PhoneForwarded,
  Plug2,
  Settings2,
  Tags,
  Users,
  LogOut,
  FileClock,
  Radio,
  HeartPulse,
  Database,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { talkoConfig } from "@/lib/config";

const NAV: { section: string; items: { href: string; label: string; icon: React.ElementType; blurb: string }[] }[] = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, blurb: "KPIs, trends, live status" },
      { href: "/analytics", label: "Analytics", icon: BarChart3, blurb: "Agent, board and trend reports" },
      { href: "/health", label: "Health", icon: HeartPulse, blurb: "Service and dependency checks" },
    ],
  },
  {
    section: "Voice",
    items: [
      { href: "/calls", label: "Calls", icon: PhoneCall, blurb: "Place, hang up, transfer" },
      { href: "/cdr", label: "CDR & History", icon: FileClock, blurb: "Call logs and dispositions" },
      { href: "/call-records", label: "Call Records", icon: BookUser, blurb: "Manual record keeping" },
      { href: "/dialer", label: "Dialer", icon: Radio, blurb: "Lead lists and campaigns" },
      { href: "/dids", label: "DIDs", icon: ListOrdered, blurb: "Inventory and AI binding" },
    ],
  },
  {
    section: "Configuration",
    items: [
      { href: "/vendors", label: "Vendors", icon: Database, blurb: "Telephony providers" },
      { href: "/vendor-configs", label: "Vendor Configs", icon: Settings2, blurb: "Endpoints and handlers" },
      { href: "/partner-configs", label: "Partner Configs", icon: Users, blurb: "Vendor wiring per partner" },
      { href: "/agent-mapping", label: "Agent Mapping", icon: PhoneForwarded, blurb: "Agents to DIDs and boards" },
      { href: "/custom-fields", label: "Custom Fields", icon: Tags, blurb: "CDR extensions" },
    ],
  },
  {
    section: "Integrations",
    items: [
      { href: "/api-keys", label: "API Keys", icon: KeyRound, blurb: "Issue and revoke keys" },
      { href: "/webhooks", label: "Webhooks", icon: Plug2, blurb: "Delivery configs and logs" },
      { href: "/assets", label: "Assets", icon: Activity, blurb: "Call and digital assets" },
    ],
  },
];

export const NAV_INDEX = NAV.flatMap((g) => g.items);

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const authMode = useAuthStore((s) => s.authMode);
  const partnerId = useAuthStore((s) => s.partnerId);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-navy text-white transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
      style={{ backgroundImage: "linear-gradient(180deg, #232b5c 0%, #1f2650 30%, #161b3d 100%)" }}
    >
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ember text-base font-extrabold text-white shadow-lg">
          T
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight tracking-tight">
              {talkoConfig.appName}
            </p>
            <p className="flex items-center gap-1.5 text-[11px] leading-tight text-white/55">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              talko-service console
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="slim-scroll flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            {!collapsed && (
              <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <li key={item.href} title={collapsed ? item.label : undefined}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-all",
                        active
                          ? "bg-ember font-semibold text-white shadow-md"
                          : "font-medium text-white/70 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon size={17} strokeWidth={active ? 2.4 : 2} className="shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Identity */}
      <div className="border-t border-white/10 p-2.5">
        {!collapsed && (
          <div className="mb-2 rounded-lg bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/60">
            <div className="flex items-center justify-between">
              <span>Auth</span>
              <span className="rounded bg-white/10 px-1.5 py-px font-mono text-[10px] font-semibold text-white">
                {authMode === "apiKey" ? "API-KEY" : "JWT"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Partner</span>
              <span className="font-mono text-[11px] font-semibold text-honey">
                {partnerId || "—"}
              </span>
            </div>
          </div>
        )}
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            title="Sign out"
            className={cn(
              "flex h-8 items-center justify-center gap-2 rounded-lg border border-white/15 text-[13px] font-medium text-white/80 hover:bg-white/10 hover:text-white cursor-pointer",
              collapsed ? "w-full" : "flex-1",
            )}
          >
            <LogOut size={15} />
            {!collapsed && "Sign out"}
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand" : "Collapse"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            {collapsed ? <ChevronsRight size={15} /> : <ChevronsLeft size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
