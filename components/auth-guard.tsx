"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { fetchAuthContext } from "@/lib/services";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const authMode = useAuthStore((s) => s.authMode);
  const token = useAuthStore((s) => s.token);
  const apiKey = useAuthStore((s) => s.apiKey);
  const isSuperadmin = useAuthStore((s) => s.isSuperadmin);
  const role = useAuthStore((s) => s.role);
  const setSuperadmin = useAuthStore((s) => s.setSuperadmin);
  const setRole = useAuthStore((s) => s.setRole);

  const authed =
    (authMode === "jwt" && Boolean(token)) || (authMode === "apiKey" && Boolean(apiKey));

  useEffect(() => {
    if (hydrated && !authed) router.replace("/login");
  }, [hydrated, authed, router]);

  // Resolve the superadmin flag + role once per JWT session (e.g. restored
  // sessions). Refetches when role is missing so pre-role sessions self-heal.
  useEffect(() => {
    if (!hydrated || !authed || authMode !== "jwt") return;
    if (isSuperadmin !== null && role !== null) return;
    let cancelled = false;
    fetchAuthContext()
      .then((ctx) => {
        if (cancelled) return;
        setSuperadmin(ctx.is_superadmin);
        setRole(ctx.role ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setSuperadmin(null);
        setRole(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, authed, authMode, isSuperadmin, role, setSuperadmin, setRole]);

  if (!hydrated) {
    return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  }
  if (!authed) return null;
  return <>{children}</>;
}
