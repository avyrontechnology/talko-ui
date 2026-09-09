/**
 * Username/password auth against the console auth service.
 *
 * talkoConfig.authLoginUrl points at the console auth surface: either the
 * login endpoint itself (.../do_login) or its base (do_login/do_signup are
 * appended). Login posts { credential, password } + ?svc_name=... and
 * returns { status, data: { access_token } }. Signup posts the console
 * UserData shape and returns the created user (no token) — callers log in
 * right after. Callers only depend on AccountCredential / SignupPayload.
 */
import { talkoConfig } from "./config";

export interface AccountCredential {
  token?: string;
  apiKey?: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone_number: string;
  password: string;
  partner_id?: number;
}

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

function loginUrl(): string {
  const base = stripTrailingSlashes(talkoConfig.authLoginUrl);
  return /\/do_login$/.test(base) ? base : `${base}/do_login`;
}

function signupEndpointUrl(): string {
  const base = stripTrailingSlashes(talkoConfig.authLoginUrl);
  if (/\/do_login$/.test(base)) return base.replace(/\/do_login$/, "/do_signup");
  if (/\/do_signup$/.test(base)) return base;
  return `${base}/do_signup`;
}

function svcName(): string {
  return process.env.NEXT_PUBLIC_AUTH_SVC_NAME ?? "console";
}

function normalizeCredential(payload: unknown): AccountCredential {
  const root =
    payload !== null &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>) &&
    (payload as { data: unknown }).data !== null &&
    typeof (payload as { data: unknown }).data === "object"
      ? ((payload as { data: Record<string, unknown> }).data as Record<string, unknown>)
      : (payload as Record<string, unknown>);
  const pick = (...keys: string[]): string | undefined => {
    for (const key of keys) {
      const value = root?.[key];
      if (typeof value === "string" && value) return value;
    }
    return undefined;
  };
  const token = pick("token", "access_token");
  const apiKey = pick("apiKey", "api_key");
  if (!token && !apiKey) throw new Error("Auth service returned no token or API key");
  return { token, apiKey };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const errBody = (await res.json()) as Record<string, unknown>;
      detail =
        (typeof errBody?.detail === "string" && errBody.detail) ||
        (typeof errBody?.message === "string" && errBody.message) ||
        "";
    } catch {
      /* non-JSON error */
    }
    throw new Error(detail || `Auth request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function isAccountAuthConfigured(): boolean {
  return Boolean(talkoConfig.authLoginUrl);
}

export async function loginWithAccount(
  username: string,
  password: string,
): Promise<AccountCredential> {
  const url = `${loginUrl()}?svc_name=${encodeURIComponent(svcName())}`;
  return normalizeCredential(
    await postJson(url, { credential: username, password }),
  );
}

export async function signupWithAccount(
  payload: SignupPayload,
): Promise<void> {
  await postJson(signupEndpointUrl(), {
    name: payload.name,
    email: payload.email,
    phone_number: payload.phone_number,
    password: payload.password,
    ...(payload.partner_id != null ? { partner_id: payload.partner_id } : {}),
  });
}
