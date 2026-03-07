# PortfolioGuardian Application Platform

Production-focused foundation for the PortfolioGuardian online application and internal admin portal, based on `PRD.md`.

## Workspace layout

```text
apps/
  api/        Express API, submission flow, admin endpoints, integrations
  web/        Next.js public application + internal admin portal
packages/
  shared/     Shared schemas, types, pricing/routing logic
```

## Key implementation decisions

- Public application and admin portal live in the same Next.js app under separate route groups.
- Express remains the system API boundary for submissions, admin data access, and outbound integrations.
- Shared Zod schemas and assessment logic live in `packages/shared` to keep UI and API aligned.
- Supabase is the system of record for applications, entities, outcomes, notes, and admin users.
- Resend notifications are triggered after successful submission persistence. Email failure must not fail the submission.

## Next steps

1. Install dependencies with `npm install`.
2. Build Supabase migrations and repository implementations.
3. Implement the multi-step form flow and repeatable entity editor.
4. Add authenticated admin data flows and protected routes.
5. Replace placeholder notification logic with Resend delivery.
