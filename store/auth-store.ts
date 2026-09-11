"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { talkoConfig } from "@/lib/config";

export type AuthMode = "jwt" | "apiKey";

interface AuthState {
  authMode: AuthMode | null;
  /** Bearer JWT (console-issued, validated by talko via gRPC). */
  token: string | null;
  /** Talko partner API key (tkp_live_* or console API key). Sent as API-KEY header. */
  apiKey: string | null;
  partnerId: string;
  label: string;
  /** Resolved from GET /auth/context after JWT login; null = unknown. */
  isSuperadmin: boolean | null;
  /** Talko-native role (superadmin/maintainer/viewer); null = unknown. */
  role: string | null;
  /** Superadmin cross-partner scope; sent as X-Partner-Scope (JWT only). */
  scopedPartnerId: string | null;
  _hasHydrated: boolean;
  loginWithToken: (token: string, opts?: { partnerId?: string; label?: string }) => void;
  loginWithApiKey: (apiKey: string, opts?: { partnerId?: string; label?: string }) => void;
  logout: () => void;
  setHydrated: () => void;
  setSuperadmin: (value: boolean | null) => void;
  setRole: (value: string | null) => void;
  setScope: (partnerId: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authMode: null,
      token: null,
      apiKey: null,
      partnerId: "",
      label: "",
      isSuperadmin: null,
      role: null,
      scopedPartnerId: null,
      _hasHydrated: false,
      loginWithToken: (token, opts) =>
        set({
          authMode: "jwt",
          token: token.trim(),
          apiKey: null,
          partnerId: opts?.partnerId ?? "",
          label: opts?.label ?? "",
          isSuperadmin: null,
          role: null,
          scopedPartnerId: null,
        }),
      loginWithApiKey: (apiKey, opts) =>
        set({
          authMode: "apiKey",
          apiKey: apiKey.trim(),
          token: null,
          partnerId: opts?.partnerId ?? "",
          label: opts?.label ?? "",
          isSuperadmin: false,
          role: null,
          scopedPartnerId: null,
        }),
      logout: () =>
        set({
          authMode: null,
          token: null,
          apiKey: null,
          partnerId: "",
          label: "",
          isSuperadmin: null,
          role: null,
          scopedPartnerId: null,
        }),
      setHydrated: () => set({ _hasHydrated: true }),
      setSuperadmin: (value) => set({ isSuperadmin: value }),
      setRole: (value) => set({ role: value }),
      setScope: (partnerId) =>
        set({ scopedPartnerId: partnerId, partnerId: partnerId ?? "" }),
    }),
    {
      name: talkoConfig.tokenStorageKey,
      partialize: (s) => ({
        authMode: s.authMode,
        token: s.token,
        apiKey: s.apiKey,
        partnerId: s.partnerId,
        label: s.label,
        isSuperadmin: s.isSuperadmin,
        role: s.role,
        scopedPartnerId: s.scopedPartnerId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useIsAuthenticated() {
  const authMode = useAuthStore((s) => s.authMode);
  const token = useAuthStore((s) => s.token);
  const apiKey = useAuthStore((s) => s.apiKey);
  if (authMode === "jwt") return Boolean(token);
  if (authMode === "apiKey") return Boolean(apiKey);
  return false;
}
