"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const authMode = useAuthStore((s) => s.authMode);
  const token = useAuthStore((s) => s.token);
  const apiKey = useAuthStore((s) => s.apiKey);

  const authed =
    (authMode === "jwt" && Boolean(token)) || (authMode === "apiKey" && Boolean(apiKey));

  useEffect(() => {
    if (hydrated && !authed) router.replace("/login");
  }, [hydrated, authed, router]);

  if (!hydrated) {
    return <div className="p-8 text-sm text-zinc-500">Loading…</div>;
  }
  if (!authed) return null;
  return <>{children}</>;
}
