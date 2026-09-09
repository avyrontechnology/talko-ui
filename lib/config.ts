/**
 * Central runtime config for Talko UI.
 * All values are overridable via NEXT_PUBLIC_* env vars.
 */
export const talkoConfig = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_TALKO_API_BASE_URL ??
    "http://localhost:8003/talko-service/v1",
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "Talko Admin",
  // Optional: console auth surface for username/password auth (Account tab +
  // signup). Either the login endpoint itself (.../do_login) or its base —
  // do_login/do_signup are appended as needed. Login posts
  // { credential, password } + ?svc_name=... (NEXT_PUBLIC_AUTH_SVC_NAME,
  // default "console") and returns { access_token }.
  authLoginUrl: process.env.NEXT_PUBLIC_AUTH_LOGIN_URL ?? "",
  tokenStorageKey: "talko.auth",
} as const;
