# Base44 dev environment — Accumulator Options Trading App

## What this is
A frontend-only Next.js 16 (App Router, Turbopack) accumulator/rise-fall options
trading app. It talks to the Deriv **public WebSocket API** directly from the
browser — there is **no backend, no database, no API service**. The only
container is the `web` dev server.

## Run it
```
docker compose -f docker-compose.base44.yml up -d
```
- Base image `node:22`, source bind-mounted at `/app`, `node_modules` kept in
  an anonymous volume. Command runs `npm install` then `npm run dev`
  (`next dev -p 3000 -H 0.0.0.0`).
- First boot runs `npm install` (npm workspaces → also installs
  `packages/core`). The `postinstall` script copies SmartCharts Flutter assets
  from `node_modules/@deriv-com/smartcharts-champion/dist` into `public/`.
- Live reload is on (Turbopack). Edits to source appear in the preview without
  a rebuild or `reload_preview`.

## Credentials
The app boots and renders live charts/ticks **without** credentials. OAuth
login and placing trades require Deriv credentials, delivered via the
platform-managed `/run/base44/app.env` (listed last in compose `env_file`, so
it overrides `.env.base44-defaults`):

- `NEXT_PUBLIC_DERIV_APP_ID` — Deriv app ID from the App Registration dashboard
  (https://developers.deriv.com/dashboard/).
- `NEXT_PUBLIC_DERIV_REDIRECT_URI` — OAuth redirect URI; must exactly match
  the one registered for the Deriv app. For this preview use
  `https://3000-<BASE44_PUBLIC_HOST_SUFFIX>`.
- Optional: `NEXT_PUBLIC_DERIV_APP_NAME`, `NEXT_PUBLIC_DERIV_OAUTH_SCOPES`,
  `NEXT_PUBLIC_DERIV_REFERRAL_LINK`, `NEXT_PUBLIC_DERIV_ENV`
  (`production` | `preview`).

When `APP_ID`/`REDIRECT_URI` are absent the app shows a "Waiting for
environment variables to be set…" toast (see `components/custom/env-check.tsx`)
but still renders.

## Preview host
The preview is served through `https://3000-<BASE44_PUBLIC_HOST_SUFFIX>`.
`next.config.js` adds `allowedDevOrigins` derived from `BASE44_PUBLIC_HOST_SUFFIX`
(passed into the service via compose `environment`) so Next.js dev assets/HMR
are not blocked. Never hardcode the suffix — it changes when the environment is
recreated.

## Verify
- `curl -sf -H "Host: 3000-<suffix>" http://localhost:3000/` → HTTP 200,
  `<title>EPITOME TRADERS</title>`.
- Served chunks are Turbopack dev modules (`/_next/static/chunks/node_modules_...`),
  confirming live source (not a prebuilt bundle).
- `docker compose -f docker-compose.base44.yml logs web` for compile/runtime
  errors.

## Notes / quirks
- `next.config.js` has `output: 'standalone'`; this does not affect dev mode.
- Tailwind warns that `content` pattern `./packages/**/*.ts` matches node_modules
  — harmless in dev.
- `lib/get-logo-src.ts` and `lib/build-favicon-uri.ts` use `fs` (server-only);
  called from `app/layout.tsx` (Server Component). No logo file is committed, so
  the header shows a letter-badge fallback and the favicon is a generated SVG.
