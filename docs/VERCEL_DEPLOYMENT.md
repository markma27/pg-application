# Publish the application form to Vercel

Users only ever see the **landing page and the form** on your main domain. The form submits to your own site (`/api/applications`); processing runs in the **same** Next.js deployment (no separate API URL).

---

## What you deploy

**Single Vercel project (recommended)** — Root Directory: `apps/web`

- Serves the landing page and the application form.
- `POST /api/applications` validates the payload and runs submission logic from `@pg/submission` (Supabase persistence, email notifications).
- Set the same **server-side** environment variables the backend needs: Supabase service role, Resend, notification email, `ADMIN_APP_URL`, etc. (see your `.env.local` / team docs).

---

## Build (monorepo)

- **Root Directory**: `apps/web`
- **Framework**: Next.js (auto-detected)
- **Build Command**: leave the default **`npm run build`** (or **`npm run build`** at the Vercel project root for `apps/web`). The `@pg/web` **`build`** script compiles `@pg/shared` and `@pg/submission`, then runs **`next build`**.

- **`apps/web/vercel.json`** sets **`installCommand`** to **`cd ../.. && npm ci`** so install uses the **repository root** `package-lock.json` and workspace layout (fixes **`Can't resolve '@pg/submission'`** when Vercel only installed under `apps/web`).

- **`apps/web/package.json`** lists **`@pg/shared`** and **`@pg/submission`** as **`file:../../packages/...`** so those packages resolve from the cloned repo even when the installer cwd is `apps/web`.

- Requires **“Include source files outside of the Root Directory”** to be **on**.

- Locally, if `next dev` cannot resolve `@pg/submission`, run once: `npm run build -w @pg/shared && npm run build -w @pg/submission` (or `npm run build:web` from the repo root).

- **Environment variables** (Production, Preview, Development):
  - **`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`** = your key (if you use address autocomplete).
  - **Supabase / Resend / admin** — mirror whatever you use locally for successful submissions (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `RESEND_FROM`, `APPLICATION_NOTIFICATION_EMAIL`, `ADMIN_APP_URL`, etc.).

You do **not** need `API_URL` for the public form; that was only for proxying to a separate Express server.

---

## Optional: separate API server (`apps/api`)

For local `npm run dev` you can still run the Express API on port 4000; it uses the same `@pg/submission` package. You can also deploy `apps/api` as a **second** Vercel project if you want a standalone HTTP API— it is **not** required for the public form once `apps/web` is deployed with the env vars above.

---

## Summary

| Deployment        | Root Directory | Purpose                                      |
|------------------|----------------|----------------------------------------------|
| **Web (one site)** | `apps/web`   | UI + `POST /api/applications` (full pipeline) |

- Users only open the **web** URL.
- The form posts to **your domain** (`/api/applications`).
