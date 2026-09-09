import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { talkoConfig } from "./config";
import { useAuthStore } from "@/store/auth-store";

export const api = axios.create({
  baseURL: talkoConfig.apiBaseUrl,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const { authMode, token, apiKey, scopedPartnerId } = useAuthStore.getState();
  if (authMode === "apiKey" && apiKey) {
    config.headers["API-KEY"] = apiKey;
  } else if (authMode === "jwt" && token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Superadmin cross-partner scope; backend honors it for ADMIN JWTs only.
    if (scopedPartnerId) config.headers["X-Partner-Scope"] = scopedPartnerId;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        // Interceptor runs outside React — full reload to /login is intentional here.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login?expired=1";
      }
    }
    return Promise.reject(err);
  },
);

export function unwrap<T>(payload: unknown): T {
  if (
    payload !== null &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export async function getData<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get(url, config);
  return unwrap<T>(res.data);
}

export async function postData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.post(url, body, config);
  return unwrap<T>(res.data);
}

export async function patchData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.patch(url, body, config);
  return unwrap<T>(res.data);
}

export async function putData<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.put(url, body, config);
  return unwrap<T>(res.data);
}

export async function deleteData<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const res = await api.delete(url, config);
  return unwrap<T>(res.data);
}

export function apiErrorMessage(err: unknown, fallback = "Request failed"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; detail?: string }
      | undefined;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof data?.message === "string") return data.message;
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}
