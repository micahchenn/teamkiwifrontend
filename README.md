# Team Kiwi — Hi-Line Resort frontend

React app (Create React App, JavaScript). Site header, Crappie House booking UI, and Square checkout calling **your backend** (separate repo).

## Prerequisites

- **Node.js** 18 LTS or 20 LTS ([nvm](https://github.com/nvm-sh/nvm) recommended — use `.nvmrc`)
- **npm** 9+

```bash
nvm use   # uses version from .nvmrc
```

## Quick start (local development)

```bash
git clone <repo-url>
cd teamkiwifrontend
npm ci
cp .env.example .env
# Set REACT_APP_SQUARE_APPLICATION_ID and REACT_APP_API_BASE_URL (see below), then:
npm run dev
```

Run your **backend** on the URL in `REACT_APP_API_BASE_URL` (default `http://127.0.0.1:8000`). The app calls:

- `GET {API}/api/square/config` — returns `{ applicationId, locationId }` for the Web Payments SDK
- `POST {API}/api/square/payments` — creates the charge (see payload in code / prior docs)

The backend must allow **CORS** from `http://localhost:3000` (and your production origin when deployed).

### Square checkout (sandbox)

1. Create a [Square Developer](https://developer.squareup.com/) application and copy the **Sandbox Application ID** into `REACT_APP_SQUARE_APPLICATION_ID` in `.env`.
2. Put the **Sandbox access token** only on your **backend** — never in `REACT_APP_*`.
3. Run `npm run dev`, open the Crappie House page, pick dates, **Continue to checkout**, and use a [Sandbox test card](https://developer.squareup.com/docs/devtools/sandbox/payments) (e.g. Visa `4111 1111 1111 1111`, any future expiry, CVV `111`, ZIP `12345`).

### Checkout data (what to collect)

- **Name & email** — For confirmations, passes, and your database. The checkout UI collects these before the card step.
- **Phone** — Optional; useful for day-of contact.
- **Card data** — Entered only in Square’s secure fields (Web Payments SDK). You do **not** type full card numbers into your own inputs (PCI). A **billing street address** is usually *not* required for a simple charge; Square may still ask for **postal code** in the card form for verification.
- **After payment** — Your backend returns a **`paymentId`** (and status). Store it with the booking; use Square’s **GetPayment** or webhooks to reconcile. The app sends a **`referenceId`** (UUID), structured **`booking`**, and **`guests`** (one **adult** name/email per row; children are counted in **`booking.children`** only). See `docs/backend-crappie-guests.md`.

## Environment variables

Copy `.env.example` → `.env`. Restart the dev server after changing env vars.

| Variable | Purpose |
|----------|---------|
| `REACT_APP_API_BASE_URL` | Base URL of your backend (default in code: `http://127.0.0.1:8000`). Used for Square config + payment POST unless `REACT_APP_PAYMENT_API_URL` is set. |
| `REACT_APP_PAYMENT_API_URL` | Optional. Override **only** the payment API origin (e.g. different service on Render). |
| `REACT_APP_SQUARE_APPLICATION_ID` | Public Square application ID for the Web Payments SDK. |
| `REACT_APP_SQUARE_LOCATION_ID` | Optional; only if your backend/config contract uses a fixed location id in the client. |

Do not put **Square access tokens** or other secrets in `REACT_APP_*` — they are exposed in the built bundle.

## Production build

```bash
npm ci
npm run build
```

Output is in `build/` — static HTML/CSS/JS. Set `REACT_APP_API_BASE_URL` / `REACT_APP_PAYMENT_API_URL` / `REACT_APP_SQUARE_APPLICATION_ID` in the **build environment** (e.g. Render env vars) so the bundle points at your hosted API.

**Preview locally:**

```bash
npm run preview
```

## Deploy options

### Static hosts

Build in CI or locally, upload `build/`. Configure SPA fallback to `index.html`.

- **Netlify** — `netlify.toml` (build + SPA redirect). In **Site settings → Environment variables**, set `REACT_APP_API_BASE_URL`, `REACT_APP_SQUARE_APPLICATION_ID`, etc. Netlify runs `npm ci && npm run build` from the repo root; publish directory is `build`. Redeploy after changing any `REACT_APP_*` value.
- **Vercel** — `vercel.json`
- **Render** — static site + separate backend service; set `REACT_APP_*` at build time

### Docker

```bash
cp .env.example .env
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080). `REACT_APP_*` values are baked in at **image build time**.

## Project scripts

| Script | Description |
|--------|-------------|
| `npm start` / `npm run dev` | React dev server (port 3000) |
| `npm run build` | Production bundle → `build/` |
| `npm run preview` | Serve `build/` locally |
| `npm test` | Jest |

## Optional: Adobe Fonts (Menco Bold)

Nav links use **Menco Bold** from Adobe Fonts. Until configured, **Montserrat** is used.

1. In [Adobe Fonts](https://fonts.adobe.com/fonts/menco), add **Menco Bold** to a Web Project and open **Embed**.
2. Copy the stylesheet URL (`https://use.typekit.net/xxxxxxx.css`).
3. In `public/typekit.css`, uncomment the `@import` line and paste your kit URL.

## Troubleshooting

- **`allowedHosts[0] should be a non-empty string`:** Copy `DANGEROUSLY_DISABLE_HOST_CHECK=true` from `.env.example` into `.env` (development only).
- **Checkout fails with network/CORS errors:** Start your backend; allow CORS for `http://localhost:3000`. Confirm `REACT_APP_API_BASE_URL` matches the backend URL.
- **Blank page after deploy:** Ensure the host serves `index.html` for unknown paths (SPA).
- **Node version errors:** Run `nvm use` or install Node from `.nvmrc`.

## CI

On push/PR to `main` or `master`, GitHub Actions runs `npm ci` and `npm run build` (see `.github/workflows/ci.yml`).

## Repository layout

| Path | Purpose |
|------|---------|
| `src/` | React components and styles |
| `public/` | Static assets, `index.html`, `typekit.css` |
| `.nvmrc` | Node version for local dev and CI |
| `Dockerfile` | Multi-stage: Node build → nginx |
| `docker-compose.yml` | Local container on port 8080 |
| `nginx.conf` | SPA routing + gzip for Docker image |
| `netlify.toml` / `vercel.json` | SPA fallback for those hosts |
| `.github/workflows/ci.yml` | Build verification on every push |
