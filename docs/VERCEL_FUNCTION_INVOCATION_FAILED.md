# Understanding and Fixing FUNCTION_INVOCATION_FAILED on Vercel

## 1. The fix (what we changed)

- **Added a serverless entry:** `apps/api/index.js`  
  - Imports the **built** Express app from `./dist/apps/api/src/app.js`.
  - **Exports it as the default export** so Vercel can invoke it once per request.
- **Left `server.ts` as-is** for local development only (`npm run dev` / `npm run start`).  
  - It still uses `app.listen(env.PORT)`; that is correct for a long‑running process on your machine, but must not be the entry used on Vercel.

**In the Vercel project:**

- Set **Root Directory** to `apps/api` (if this deployment is API-only).
- Ensure **Build Command** runs the API build so `dist/` exists (e.g. `npm run build` from repo root with workspaces, or your existing build that builds `@pg/api`).
- Enable **“Include source files outside of the Root Directory”** if the API depends on `packages/shared` (so the monorepo layout is available during build).

After deploy, the serverless function will use `index.js` → built `app.js` → your routes, and the 500 / FUNCTION_INVOCATION_FAILED from the wrong entry or missing modules should stop.

---

## 2. Root cause (what was going wrong)

- **What the code was doing**  
  The only entry that ran the API was `server.ts`: it called `createApp()` and then `app.listen(env.PORT)`. So the app was written as a **single long‑running Node server** that binds to a port and handles many requests over time.

- **What Vercel needs**  
  On Vercel there is **no long‑running server**. Each request is a new **serverless invocation**: a short-lived process that handles **one** request and then exits. The platform expects a **handler** (a function or, for Express, the app itself) that it can call for each request. So the “entry” must **export** the app (or a request handler), not start a listener.

- **What actually triggered the error**  
  - Either Vercel tried to run an entry that still did `app.listen()` and the process didn’t behave like a request handler, or  
  - The entry it used (e.g. something under `src/` or a wrong path) caused **module resolution to fail** (e.g. looking for files under `apps/api/src/` without the right built output), leading to **uncaught exceptions** or a crash.  
  The [Vercel doc](https://vercel.com/docs/errors/FUNCTION_INVOCATION_FAILED) states that FUNCTION_INVOCATION_FAILED can be due to the runtime process crashing or an unhandled rejection/exception—both fit “wrong entry” or “missing/bad module resolution.”

- **The oversight**  
  The app was designed for a **traditional Node server** (listen on a port). Deploying it to Vercel **without a dedicated serverless entry** that only exports the app led to the wrong execution model and/or wrong file paths, and thus to the function crashing.

---

## 3. Underlying concept (why this error exists and the right mental model)

- **Why this error exists**  
  FUNCTION_INVOCATION_FAILED is a generic “the function run for this request failed” signal. It protects you from **silent failures**: the platform tells you the invocation didn’t complete successfully so you can check logs and fix the handler, env, or dependencies.

- **Correct mental model**  
  - **Local / VM / container:** You run one process that calls `app.listen(PORT)` and keeps running; many requests hit the same process.  
  - **Vercel (serverless):** The platform starts a process per request (or reuses it briefly), calls your **exported** handler once per request, then tears down. There is no “server” you start; you only **export** something that handles `(req, res)` (or the Express app that does that).

- **How it fits**  
  Same Express app, two entry points:  
  - **Development / self‑hosted:** `server.ts` → `createApp()` + `app.listen(PORT)`.  
  - **Vercel:** `index.js` → `createApp()` and `export default app` (no `listen`).  
  The framework (Express) is the same; the **hosting contract** (long‑lived server vs one-shot handler) is what changes.

---

## 4. Warning signs and similar pitfalls

- **Look out for**  
  - Using `app.listen()` (or any “start server”) as the **only** entry in a project you deploy to Vercel.  
  - No file at the deployment root (or in `src/`) that **default‑exports** the Express app.  
  - Relying on “it works locally” without checking that the **deployed** entry is the built app (e.g. `dist/.../app.js`) and that all imports resolve in the serverless environment (e.g. correct paths and `.js` extensions for ESM).

- **Similar mistakes**  
  - Assuming the same entry runs locally and on Vercel without reading [Express on Vercel](https://vercel.com/docs/frameworks/backend/express).  
  - Putting all logic in a file that only runs `listen()` and never exporting the app.  
  - In monorepos: building from a subfolder without “Include source files outside of the Root Directory,” so `packages/shared` (or similar) is missing and the build or runtime fails.

- **Code smells**  
  - A single entry that both creates the app and calls `listen()`, with no separate export for the app.  
  - No `index.js` / `app.js` (or equivalent) at the deployment root that explicitly exports the app for the platform.

---

## 5. Alternatives and trade-offs

- **Current approach: serverless entry in the same repo**  
  - **Pros:** Simple, one repo, Express doc and Vercel’s “zero config” style; one function handles all API routes.  
  - **Cons:** Cold starts and function limits (e.g. size, duration) apply; not a long‑lived TCP server.

- **Separate API deployment (e.g. Railway, Fly, Render)**  
  - **Pros:** True long‑running server, no serverless limits; you keep `app.listen()` as the only entry.  
  - **Cons:** Separate app, URL, and env; you don’t use Vercel’s built-in Express support.

- **Next.js API routes instead of Express**  
  - **Pros:** Single Vercel project (frontend + API), no Express-specific entry.  
  - **Cons:** Rewrite API in Next.js route handlers; different routing and middleware model.

- **Vercel with default export only (what we did)**  
  - **Pros:** Minimal change: one small `index.js` that imports the built app and exports it; `server.ts` unchanged for local use.  
  - **Cons:** You must keep the build output path in sync (e.g. if `dist` layout changes, update the import in `index.js`).

Using a dedicated serverless entry that **only** exports the app is the standard, minimal fix for “Express app that used to work locally but returns 500 / FUNCTION_INVOCATION_FAILED on Vercel.”
