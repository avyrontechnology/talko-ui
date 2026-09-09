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
  const setSuperadmin = useAuthStore((s) => s.setSuperadmin);

  const authed =
    (authMode === "jwt" && Boolean(token)) || (authMode === "apiKey" && Boolean(apiKey));

  useEffect(() => {
    if (hydrated && !authed) router.replace("/login");
  }, [hydrated, authed, router]);

  // Resolve the superadmin flag once per JWT session (e.g. restored sessions).
  useEffect(() => {
    if (!hydrated || !authed || authMode !== "jwt" || isSuperadmin !== null) return;
    let cancelled = false;
    fetchAuthContext()
      .then((ctx) => {
        if (!cancelled) setSuperadmin(ctx.is_superadmin);
      })
      .catch(() => {
        if (!cancelled) setSuperadmin(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, authed, authMode, isSuperadmin, setSuperadmin]);

  if (!hydrated) {
    return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  }
  if (!authed) return null;
  return <>{children}</>;
}
