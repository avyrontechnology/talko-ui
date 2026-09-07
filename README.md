# Talko UI

Admin UI for **talko-service** (`/talko-service/v1`): calls, CDR, analytics, dialer,
DIDs, vendors, partner configs, agent mapping, custom fields, API keys, webhooks, assets.

Stack: Next.js (App Router) + TypeScript + Tailwind + axios + zustand.

## Quick start

```bash
cp .env.example .env.local   # point NEXT_PUBLIC_TALKO_API_BASE_URL at your service
npm install
npm run dev                  # http://localhost:3000
```

## Auth (own authentication)

Talko-service accepts either header on every request (see
`src/middlewares/authentication.py` in the `talko` repo):

- `API-KEY: <partner key>` — Talko-issued `tkp_live_*` or console API key
- `Authorization: Bearer <jwt>` — console-issued JWT, validated via gRPC

This UI has its **own login page** (`/login`): paste an API key or a Bearer token
(optionally with a default partner ID). It is stored only in the browser
(localStorage, key `talko.auth`) and attached to every API call by
`lib/api-client.ts`. A 401 clears the session and returns to `/login`.
Point `NEXT_PUBLIC_AUTH_LOGIN_URL` at a future username/password endpoint if you
add one — until then, direct credential entry is the login.

## Structure

- `app/login` — own-auth sign in (API key / Bearer tabs)
- `app/(dashboard)/*` — guarded pages: dashboard, calls, cdr, analytics,
  call-records, dialer, dids, vendors, vendor-configs, partner-configs,
  agent-mapping, custom-fields, api-keys, webhooks, assets, health
- `lib/` — `config.ts`, `endpoints.ts` (mirrors `src/routes/__init__.py`),
  `types.ts` (mirrors DTOs), `api-client.ts` (auth headers + `{data}` unwrap),
  `services.ts` (one function per backend operation)
- `store/auth-store.ts` — persisted credential store
- `components/` — sidebar nav, auth guard, ui primitives

## Backend reference

API catalog was derived from `talko/src/components/*/controllers.py`.
Response envelope is `{ status, message, data }` (see
`src/components/common/responses.py`) — the client unwraps `data` automatically.
