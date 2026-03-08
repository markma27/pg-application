# Vercel deployment: Option B — main site + API subdomain

One **main project** serves the landing page and form at your primary domain. A second project serves the **API on a subdomain** (e.g. `api.pg-application-theta.vercel.app`).

---

## 1. Main project (web app) — your primary domain

Visitors see the landing page and application form at your main URL (e.g. `pg-application-theta.vercel.app`).

- **Vercel project**: Create or use the project that will own your main domain.
- **Git repository**: Connect the same repo for both projects.
- **Root Directory**: `apps/web`
- **Framework Preset**: Next.js (auto-detected)
- **Build Command** (run from repo root so workspaces resolve):
  ```bash
  cd ../.. && npm ci && npm run build -w @pg/web
  ```
  Alternatively: enable **“Include source files outside of the Root Directory”** and use Build: `npm run build`.
- **Output Directory**: leave default (Next.js uses `.next` inside `apps/web`).
- **Environment variables** (Production, Preview, Development):
  - **`NEXT_PUBLIC_API_URL`** = your API base URL **with no trailing slash**, e.g.  
    `https://api.pg-application-theta.vercel.app`
  - Any others the web app needs (e.g. `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`).
- **Domain**: Attach your main domain (e.g. `pg-application-theta.vercel.app`) to **this** project.

After deploy, the main domain serves the Next.js app (landing page and form). The form will call the API using `NEXT_PUBLIC_API_URL`.

---

## 2. API project — subdomain

The Express API runs on a **subdomain** of the same (or another) Vercel project/team.

- **Vercel project**: Create a **second** project (e.g. “pg-application-api”) from the same repo.
- **Root Directory**: `apps/api`
- **Build Command** (from repo root so shared code is available):
  ```bash
  cd ../.. && npm ci && npm run build -w @pg/shared && npm run build -w @pg/api
  ```
- **Environment variables**: Whatever the API needs (Resend, Supabase, etc.).
- **Subdomain**: In this project’s **Settings → Domains**, add a subdomain of your main domain, e.g.:
  - `api.pg-application-theta.vercel.app`  
  Vercel will assign a default URL like `pg-application-api-xxx.vercel.app`; you can use that for `NEXT_PUBLIC_API_URL` or the custom subdomain once it’s set.

Use this project’s **final API URL** (subdomain or default) as `NEXT_PUBLIC_API_URL` in the web project (step 1).

---

## 3. Summary (Option B)

| Project      | Root Directory | URL example                          | Serves              |
|-------------|----------------|--------------------------------------|---------------------|
| **Web (main)** | `apps/web`     | `pg-application-theta.vercel.app`    | Landing page, form  |
| **API**       | `apps/api`     | `api.pg-application-theta.vercel.app`| Express API         |

1. Deploy both projects from the same repo.
2. Set the **web** project’s `NEXT_PUBLIC_API_URL` to the **API** project’s URL (subdomain or default).
3. Attach your main domain to the **web** project so the root URL shows the landing page.
