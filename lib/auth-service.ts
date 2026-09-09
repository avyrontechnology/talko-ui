/**
 * Username/password auth against the external auth service.
 *
 * talkoConfig.authLoginUrl points at the service's login endpoint which
 * accepts POST { username, password } and returns { token } or { apiKey }
 * (optionally wrapped in a { data } envelope). Signup posts to the sibling
 * /signup endpoint; if the service uses a different shape, adjust here —
 * callers only depend on the normalized AccountCredential below.
 */
import { talkoConfig } from "./config";

export interface AccountCredential {
  token?: string;
  apiKey?: string;
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
  const token =
    typeof root?.token === "string" && root.token ? root.token : undefined;
  const apiKey =
    typeof root?.apiKey === "string" && root.apiKey
      ? root.apiKey
      : typeof root?.api_key === "string" && root.api_key
        ? (root.api_key as string)
        : undefined;
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
    const text = await res.text().catch(() => "");
    throw new Error(text || `Auth request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export function isAccountAuthConfigured(): boolean {
  return Boolean(talkoConfig.authLoginUrl);
}

function signupUrl(): string {
  const base = talkoConfig.authLoginUrl.replace(/\/+$/, "");
  // .../login -> .../signup when the login path ends that way, else append.
  return /\/login\/?$/.test(talkoConfig.authLoginUrl)
    ? base.replace(/\/login\/?$/, "/signup")
    : `${base}/signup`;
}

export async function loginWithAccount(
  username: string,
  password: string,
): Promise<AccountCredential> {
  return normalizeCredential(
    await postJson(talkoConfig.authLoginUrl, { username, password }),
  );
}

export async function signupWithAccount(
  username: string,
  password: string,
): Promise<AccountCredential> {
  return normalizeCredential(
    await postJson(signupUrl(), { username, password }),
  );
}
