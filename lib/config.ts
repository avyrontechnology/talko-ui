/**
 * Central runtime config for Talko UI.
 * All values are overridable via NEXT_PUBLIC_* env vars.
 */
export const talkoConfig = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_TALKO_API_BASE_URL ??
    "http://localhost:8003/talko-service/v1",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Talko Admin",
  // Optional: point this at your own auth service login endpoint later.
  // When set, the login form POSTs { username, password } here and expects
  // { token } or { apiKey } back. When empty, login uses direct token entry.
  authLoginUrl: process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "",
  tokenStorageKey: "talko.auth",
} as const;
