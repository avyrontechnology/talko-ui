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
  _hasHydrated: boolean;
  loginWithToken: (token: string, opts?: { partnerId?: string; label?: string }) => void;
  loginWithApiKey: (apiKey: string, opts?: { partnerId?: string; label?: string }) => void;
  logout: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      authMode: null,
      token: null,
      apiKey: null,
      partnerId: "",
      label: "",
      _hasHydrated: false,
      loginWithToken: (token, opts) =>
        set({
          authMode: "jwt",
          token: token.trim(),
          apiKey: null,
          partnerId: opts?.partnerId ?? "",
          label: opts?.label ?? "",
        }),
      loginWithApiKey: (apiKey, opts) =>
        set({
          authMode: "apiKey",
          apiKey: apiKey.trim(),
          token: null,
          partnerId: opts?.partnerId ?? "",
          label: opts?.label ?? "",
        }),
      logout: () =>
        set({ authMode: null, token: null, apiKey: null, partnerId: "", label: "" }),
      setHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: talkoConfig.tokenStorageKey,
      partialize: (s) => ({
        authMode: s.authMode,
        token: s.token,
        apiKey: s.apiKey,
        partnerId: s.partnerId,
        label: s.label,
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
