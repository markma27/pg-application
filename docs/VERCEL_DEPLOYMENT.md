# Publish the application form to Vercel

Users only ever see the **landing page and the form** on your main domain. The form submits to your own site (`/api/applications`); the backend that processes submissions is not shown or linked anywhere.

---

## What you deploy

1. **Web project (your main site)** — Root Directory: `apps/web`  
   This is the only URL you give to users. It serves the landing page and the application form. Submissions go to your domain, then the server forwards them to the backend.

2. **Backend project (subdomain, optional to expose)** — Root Directory: `apps/api`  
   This runs the logic that saves and processes applications. Users do not visit this URL; only your web server calls it. You can put it on a subdomain (e.g. `api.your-domain.vercel.app`) or use Vercel’s default URL.

---

## Step 1: Deploy the web app (the form)

- **Vercel project**: One project for your main site (e.g. “pg-application”).
- **Root Directory**: `apps/web`
- **Framework**: Next.js (auto-detected)
- **Build Command** — override and set to (builds shared package first, then web):
  ```bash
  cd ../.. && npm run build -w @pg/shared && npm run build -w @pg/web
  ```
  Requires **“Include source files outside of the Root Directory”** to be **on**. Install runs from repo root; if install runs from `apps/web` only, use instead: `cd ../.. && npm ci && npm run build:web`.
- **Environment variables** (Production, Preview, Development):
  - **`API_URL`** = backend base URL **with no trailing slash**  
    Example: `https://api.your-domain.vercel.app` or your API project’s default Vercel URL.  
    Used only on the server to forward form submissions; **not** visible to users.
  - **`NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`** = your key (if you use address autocomplete).
- **Domain**: Attach your main domain to **this** project.

After deploy, your main URL shows the landing page and form. The form posts to your site; no API URL is shown to users.

---

## Step 2: Deploy the backend (for form processing)

- **Vercel project**: A second project (e.g. “pg-application-api”) from the same repo.
- **Root Directory**: `apps/api`
- **Build Command**:
  ```bash
  cd ../.. && npm ci && npm run build -w @pg/shared && npm run build -w @pg/api
  ```
- **Environment variables**: Whatever the API needs (Resend, Supabase, etc.).
- **Domain** (optional): Add a subdomain like `api.your-domain.vercel.app` in this project’s **Settings → Domains**. You can also use the default `*.vercel.app` URL.

Copy this project’s URL (subdomain or default) and set it as **`API_URL`** in the web project (Step 1).

---

## Summary

| Project   | Root Directory | Users see it? | Purpose                    |
|----------|----------------|---------------|----------------------------|
| **Web**  | `apps/web`     | Yes           | Landing page and form      |
| **Backend** | `apps/api`   | No            | Processes form submissions |

- Users only open the **web** URL. They never see or need the backend URL.
- The form always submits to **your domain** (`/api/applications`). The server proxies to the backend using `API_URL`.
