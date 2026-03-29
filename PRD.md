# PortfolioGuardian Application Form – Product Requirements Document (PRD)

## 1. Overview

This project is to build a web-based application form for **PortfolioGuardian (PG)** to streamline onboarding and quoting for investment portfolio administration and reporting services.

The application form should act as both:
- a **lead capture tool**
- a **scoping and triage tool**
- a **pricing input tool**
- a **routing tool** between **PortfolioGuardian** and **Jaquillard Minns (JM)**

The product should support a **productised PG service model**:
- PG handles **standardised investment portfolio administration and reporting**
- JM handles **customised, broader, or more compliance-heavy work**

This form is intended to replace the current manual pre-quote email exchange and make the process more scalable, consistent, and automation-friendly.

---

## 2. Product Goal

Build a modern online application form that:
- collects enough information to assess service fit and price
- supports **one contact with one or multiple entities**
- calculates an **indicative pricing outcome** for standard PG-fit entities
- flags and routes non-standard entities to JM
- creates a clean handoff into quote and onboarding workflows

---

## 3. Background and Strategic Context

PortfolioGuardian is intended to be a **narrow, standardised, and scalable service offering** focused on:
- investment portfolio administration
- standardised investment portfolio reporting

The long-term goal is to make this service line as streamlined and semi-automated as possible.

To preserve that model, the form must help keep PG tightly scoped.

### PG in-scope services
- investment portfolio administration
- standard annual reporting
- standard annual tax reporting support within PG scope
- possibly standard quarterly reporting if templated
- straightforward entity structures
- standardised delivery only

### PG out-of-scope services
These should be routed to JM:
- customised reporting
- PAF / PuAF services
- annual financial statements
- audit liaison
- ACNC Annual Information Statement
- responsible person services
- broader accounting, tax, compliance, or advisory work
- highly bespoke or judgment-heavy work

---

## 4. Objectives

### Business objectives
- reduce manual back-and-forth before quoting
- standardise data captured before engagement
- support scalable quoting logic
- preserve PG as a productised service line
- route bespoke work to JM early
- improve client experience and reduce friction

### User objectives
- understand whether their portfolio is a fit for PG
- provide information once, in a structured and guided way
- avoid long email exchanges
- receive either:
  - indicative pricing for standard PG cases, or
  - a clear message that a tailored proposal will follow

### Operational objectives
- allow staff to review submissions in a consistent format
- support per-entity pricing and multi-entity discount rules
- support later onboarding workflows and document collection

---

## 5. Success Metrics

### Primary success metrics
- reduction in time spent by staff before first quote is issued
- application completion rate
- percentage of leads successfully triaged into PG vs JM
- reduction in incomplete or low-quality enquiries

### Secondary success metrics
- quote turnaround time
- onboarding turnaround time
- conversion rate from application to proposal
- percentage of submissions requiring manual clarification before pricing

---

## 6. Users

### Primary users
- prospective clients seeking PG services
- existing clients adding new entities or portfolios
- advisers or representatives submitting on behalf of clients

### Internal users
- PG operations/admin staff
- JM staff reviewing routed enquiries
- directors/managers reviewing quotes and onboarding

---

## 7. Core User Stories

### External user stories
- As a client, I want to complete one online application for my investment entities so I do not need to email information back and forth.
- As a client, I want to add multiple entities in one application so my trust, company, SMSF, and related entities can be assessed together.
- As a client, I want the form to feel simple and guided rather than technical or accountant-heavy.
- As a client, I want to know whether my requirements fit PG or require separate review.
- As a client, I want to receive an indicative price for simple cases where possible.

### Internal user stories
- As a PG team member, I want each entity assessed separately so pricing and scope decisions are consistent.
- As a PG team member, I want the system to flag PAF, PuAF, customised reporting, and other non-standard cases automatically.
- As a PG/JM reviewer, I want all submissions stored in a structured database so I can review them efficiently.
- As an internal user, I want the application to feed directly into quote and onboarding workflows later.

---

## 8. Scope

### In scope for version 1
- responsive web application form
- multi-step guided form flow
- one shared application with one or multiple entities
- repeatable entity modules
- conditional logic based on entity type and service selection
- pricing rules for standard PG-fit entities
- routing logic for JM-fit entities
- summary/review screen before submit
- admin-friendly storage in Supabase
- basic internal status tracking for submissions
- confirmation screen after submission
- internal admin portal for authorised staff
- notification emails when new applications are received

### Out of scope for version 1
- full proposal / engagement document generation
- client login portal
- payment collection
- document upload workflows beyond simple placeholders
- full CRM integration
- advanced business intelligence/reporting dashboards
- direct Class/Praemium/Xero integration

---

## 9. Admin Portal

An internal admin portal is required so the PG/JM admin team can securely log in and review submitted applications.

### Admin portal goals
- provide a simple and modern internal interface for reviewing applications
- reduce reliance on raw database access or manual email-based processing
- allow staff to quickly identify new, in-progress, PG-fit, JM-routed, and manual-review applications
- create a clean operational handoff from online submission to internal review

### Admin portal users
- PG admin team
- PG operations staff
- JM staff reviewing referred applications
- directors/managers who need visibility over application status

### Core admin portal requirements
- secure login for authorised internal users
- application list view
- application detail view
- filtering and search
- status updates and internal notes
- clear visibility of PG vs JM routing outcome
- clear visibility of indicative pricing outputs where applicable

### Admin portal UX requirements
The admin portal should be easy to use and have a modern internal web app design.

Required layout characteristics:
- top header
- left sidebar navigation
- clean card/table-based content area
- responsive desktop-first experience
- modern UI consistent with shadcn/ui patterns

### Suggested admin portal layout

#### Header
Should include:
- product/admin title
- current user
- quick actions if needed
- logout/account menu

#### Sidebar
Suggested sections:
- Dashboard
- Applications
- PG Review Queue
- JM Referral Queue
- Manual Review
- Settings (future)

### Suggested admin portal screens

#### 1. Login screen
- internal user authentication
- clean branded login experience

#### 2. Dashboard
- counts for new applications
- PG-fit applications awaiting review
- JM-routed applications awaiting review
- manual-review items
- recent submissions

#### 3. Applications list
- searchable/filterable list of submissions
- sortable by date, status, routing outcome, contact name, and entity count

#### 4. Application detail page
- shared contact/application details
- entity-by-entity breakdown
- pricing summary
- routing outcome summary
- internal notes
- status controls

#### 5. Review actions
Internal users should be able to:
- update application status
- add internal notes
- mark application as reviewed
- mark application for PG follow-up
- mark application for JM follow-up

### Suggested application statuses
- New
- Under Review
- PG Follow-up Required
- JM Follow-up Required
- Waiting on Client
- Quoted
- Closed

---

## 10. Recommended Product Flow

### High-level flow
1. User lands on PG application page
2. User enters shared contact/group details
3. User adds one or more entities
4. User completes each entity form
5. System evaluates each entity against PG scope and pricing rules
6. User reviews summary
7. User submits application
8. System stores submission in Supabase
9. System determines:
   - indicative PG pricing (if eligible)
   - JM routing requirement (if applicable)
10. User sees confirmation outcome
11. Internal team reviews and follows up

---

## 10a. Information Architecture

### Shared application-level section
This information is captured once per application:
- primary contact name
- email address
- phone number
- role / relationship to client
- adviser / representative details if applicable
- whether application is for one entity or multiple entities
- optional family/group name

### Entity-level section (repeatable)
This information is captured per entity:
- entity type
- entity name
- whether portfolio is new or existing
- estimated number of listed investments
- estimated number of unlisted investments
- estimated number of investment properties
- estimated number of wrap/platform accounts
- other assets (optional text, e.g. crypto)
- foreign investments present (yes/no)
- services required
- preferred commencement financial year/date

### Entity-level additional logic
If entity type is PAF or PuAF:
- show notice that these services are provided by JM
- collect additional scoping info
- do not show instant pricing
- mark for JM follow-up

If customised reporting is selected:
- mark for JM follow-up or manual review

---

## 11. UX Requirements

### UX principles
- clean and premium, not accountant-heavy
- simple multi-step experience
- minimal free-text fields
- mostly radio buttons, checkboxes, segmented selectors, and numeric inputs
- clear progress indication
- mobile-friendly but optimised for desktop completion
- supportive helper text where needed

### Form design pattern
Use a **multi-step wizard** with:
- stepper/progress indicator
- one major section per step
- review screen before submission
- repeatable entity cards/modules

### Recommended steps
1. Contact / group details
2. Add entities
3. Entity details (repeatable)
4. Review and summary
5. Confirmation

### Entity card behavior
User can:
- add another entity
- edit an existing entity
- remove an entity before submission

### Important UX behavior
- if multiple entities exist, show a summary card list before final review
- if a PAF/PuAF entity is added, clearly explain JM will handle those services
- if client selects out-of-scope service, show a contextual notice rather than an error

---

## 12. Functional Requirements

### 12.1 Frontend
The frontend will be built in **Next.js** using **shadcn/ui**.

Required frontend features:
- multi-step form
- client-side validation
- repeatable entity subforms
- conditional rendering
- summary/review page
- submit state and confirmation state
- graceful handling of validation errors
- loading and error states

### 12.2 Backend API
The backend will be built in **Node.js + Express**.

Required backend responsibilities:
- receive application submission
- validate and normalise payload
- persist data into Supabase
- run pricing/routing logic
- trigger email notification workflow for new applications
- return structured submission result
- support internal retrieval in future
- support admin portal authentication/authorisation and data access

### 12.3 Database
Database will be **Supabase**.

Required storage areas:
- applications
- contacts
- entities
- entity services
- pricing outcomes
- routing outcomes
- audit/status fields

### 12.4 Pricing engine
Pricing is intended to be calculated **per entity**.

Recommended model:
- base fee by entity type
- complexity points by asset mix / counts
- add-ons for reporting and extra services
- group discount for 3+ entities
- manual quote trigger for edge cases

### 12.5 Routing engine
Each entity should be routed as:
- PG-fit
- JM-fit
- manual review

The application can contain a mix of entities across those outcomes.

### 12.6 Email notifications
When a new application is submitted, the system must send a notification email to:
- `applications@portfolioguardian.com.au`

Email delivery provider:
- **Resend**

Notification email requirements:
- trigger automatically after successful application submission
- include enough summary information for the admin team to triage quickly
- include application id/reference
- include contact name and email
- include number of entities submitted
- include high-level PG/JM/manual-review outcome
- include indicative pricing summary if available
- include direct link to admin portal detail page when available

Failure handling:
- application submission should still succeed even if email notification fails
- email failure should be logged for follow-up/retry

### 12.7 Admin portal
The system must include an internal admin portal.

Required admin portal features:
- secure login for authorised staff
- protected routes
- application dashboard
- application list and detail views
- filters for routing outcome and status
- internal notes and status management
- visibility of pricing and routing decisions

---

## 13. Business Rules

### 13.1 Entity handling
- one application may include multiple entities
- each entity must be assessed separately
- shared contact details should only be collected once

### 13.2 PG fit rules
Entities can be eligible for PG if they remain within standard service scope.

Potential PG triggers:
- standard investment administration selected
- standard investment reporting selected
- no customised reporting
- not PAF/PuAF
- no broader JM-only services selected

### 13.3 JM routing triggers
Route entity to JM if any of the following apply:
- entity type is PAF or PuAF
- customised reporting selected
- broader accounting/compliance requirements apply
- complexity exceeds threshold
- manual review flag triggered

### 13.4 Online quote display rules
Do **not** show a final binding quote online.

Recommended behavior:
- simple PG-fit cases: show indicative pricing or range
- more complex PG-fit cases: show “we will review and confirm pricing”
- JM-fit cases: show “your enquiry will be reviewed separately by Jaquillard Minns”

### 13.5 Multi-entity discount
Indicative annual pricing should support group discount logic:
- 1–2 entities: no discount
- 3 entities: 5% discount on annual recurring PG fees
- 4–5 entities: 10% discount on annual recurring PG fees
- 6+ entities: manual review

Discount should apply only to annual recurring PG-fit fees, not onboarding or JM work.

---

## 14. Pricing Logic (Initial Recommended Model)

### Base annual fee per entity
- Individual / Company / Trust: $1,800 + GST
- SMSF: $2,000 + GST
- PAF / PuAF: no instant pricing; route to JM

### Complexity points
- Listed investment: 1 point each
- Unlisted investment: 5 points each
- Investment property: 6 points each
- Wrap / platform account: 3 points each
- Crypto / alternative assets present: 5 points
- Foreign investments present: 3 points

### Complexity fee bands
- 0–10 points: $0
- 11–20 points: $700
- 21–30 points: $1,300
- 31–40 points: $2,000
- 41–50 points: $2,800
- 51+ points: manual review

### Reporting add-ons
- Annual reporting: included
- Quarterly reporting: +$1,200
- Monthly reporting: +$3,000
- Customised reporting: route to JM or manual review

### Other add-ons
- BAS: +$900
- ASIC agent: +$300
- ACNC AIS: JM / specific logic only
- Responsible person: JM only
- Audit liaison / franking credit refund support: JM only
- Sub-fund monthly statements: JM only

### Onboarding fee per entity
- New portfolio: $750
- Existing clean portfolio: $1,500
- Existing with reconciliation: $2,500
- Complex cleanup: manual review

### Important note
This logic should be stored in a way that is easy to configure later, not hard-coded deep in UI components.

---

## 15. Suggested Data Model

### applications
- id
- created_at
- updated_at
- primary_contact_name
- email
- phone
- applicant_role
- group_name
- status
- overall_outcome
- notification_email_sent
- notification_email_sent_at
- notification_email_error

### application_entities
- id
- application_id
- entity_name
- entity_type
- portfolio_status (new/existing)
- listed_investment_count
- unlisted_investment_count
- property_count
- wrap_count
- other_assets_text
- has_crypto
- has_foreign_investments
- service_start_date
- routing_outcome
- complexity_points
- indicative_annual_fee
- indicative_onboarding_fee
- pricing_status

### entity_services
- id
- entity_id
- service_code
- service_label

### application_pricing_summary
- id
- application_id
- pg_annual_subtotal
- pg_onboarding_subtotal
- group_discount_amount
- pg_total_estimate
- contains_jm_entities
- manual_review_required

### admin_users
- id
- email
- full_name
- role
- is_active
- created_at
- last_login_at

### audit / internal workflow fields
- internal_owner
- internal_notes
- follow_up_status
- quote_status
- reviewed_at
- reviewed_by

## 16. Validation Requirements

### Shared contact validation
- name required
- valid email required
- phone required or recommended depending on business preference

### Entity validation
- entity type required
- entity name required
- portfolio status required
- all numeric fields must be non-negative integers
- at least one service selection required
- commencement field required

### Conditional validation
- if PAF/PuAF selected, show and validate extra PAF/PuAF fields if retained in v1
- if multiple entities added, all must be complete before review/submit

---

## 17. Non-Functional Requirements

### Performance
- form interactions should feel instant
- page load should be fast
- submission should complete reliably with clear success/failure feedback

### Security
- basic input validation both client-side and server-side
- protect API endpoints against malformed payloads
- store only necessary personal and portfolio scoping information
- support future retention/deletion policies

### Maintainability
- clear separation between UI, validation, pricing logic, and routing logic
- pricing/routing rules should be configurable and testable
- backend should use modular service structure

### Accessibility
- use accessible form controls
- keyboard navigable
- sufficient contrast and label clarity

---

## 18. Technical Stack

### Frontend
- Next.js
- TypeScript preferred
- shadcn/ui
- React Hook Form
- Zod for validation

### Backend
- Node.js
- Express
- TypeScript preferred
- REST API

### Database
- Supabase (Postgres)

### Email
- Resend

### Suggested project structure
- frontend app separated from backend API
- shared types/schemas where possible
- pricing and routing logic extracted into shared packages (`@pg/shared`, `@pg/submission`)

---

## 19. API Requirements

### Public endpoints (implemented)
- `POST /applications` (Express, `apps/api`) — submit a full application payload validated with `fullApplicationSubmissionSchema` from `@pg/shared`; persistence, pricing/routing, and notification email orchestration live in `@pg/submission`.

### Internal/admin endpoints (PRD vs implementation)
- **Authentication** is **Supabase Auth** (email/password, recovery, invite links) via the Next.js app. There is no separate Express `POST /admin/auth/login` in production use.
- **Admin CRUD and reads** are implemented through **Next.js** (Server Components, Server Actions) with the **Supabase** client and **RLS** policies, not through the Express `admin` router stubs in `apps/api` (those routes return placeholder JSON).

### Submission response (implemented)
The API returns structured JSON including application identifiers, routing/pricing outcomes, and related metadata consistent with `submitApplication` in `@pg/submission`.

### Notification email trigger (implemented)
After successful `POST /applications` processing:
1. persist application data in Supabase
2. calculate routing/pricing outcome
3. attempt to send notification email via Resend (failure is recorded; submission still succeeds)
4. return success response to the client

---

## 20. Confirmation and Outcome Messaging

### PG simple case
Show:
- confirmation that application has been received
- indicative annual fee and onboarding fee, if eligible
- note that final proposal will be confirmed after review

### PG more complex case
Show:
- confirmation received
- application under review
- pricing will be confirmed by team

### JM-routed case
Show:
- confirmation received
- requirements will be reviewed by Jaquillard Minns
- separate quote / engagement will follow if appropriate

---

## 21. Future Enhancements

Potential later enhancements:
- richer internal admin dashboard analytics
- quote PDF generation
- email automation beyond basic notifications
- document upload workflow
- onboarding task tracking
- CRM integration
- digital engagement workflow
- data retention / deletion automation
- adviser-specific submission path
- role-based permissions expansion for admin portal

## 22. Risks and Design Considerations

### Key risks
- PG scope creep if routing rules are too loose
- overcomplicated UX if too much is asked upfront
- underquoting if pricing logic is too aggressive
- user confusion between PG and JM if messaging is unclear
- poor maintainability if pricing rules are embedded across many components

### Mitigations
- keep PG scope narrow and explicit
- use one application with repeatable entity modules
- assess and route each entity separately
- use indicative pricing, not binding online quotes
- keep JM routing messaging clear and professional

---

## 23. Open Questions

These should be confirmed before build or during early implementation:
- Should users be allowed to save and resume later?
- Will PAF/PuAF-specific questions be included in v1 or handled after follow-up?
- Should phone number be mandatory?
- Should indicative pricing be shown at all, or only stored internally at first?
- Should JM-routed entities still be included in the same final summary screen?
- Will PG and JM communications both come from JM email addresses?
- What exact copy should be shown for PG vs JM outcomes?

---

## 24. MVP Recommendation

For MVP, build:
- multi-step application
- repeatable entity entry
- pricing calculation for standard PG-fit entities
- JM routing logic
- review screen
- confirmation screen
- Supabase persistence

Delay:
- proposal generation
- advanced admin dashboard
- document automation
- integration-heavy workflows

---

## 25. Final Product Principle

This application should support the following operating rule:

> **If it can be standardised, it stays in PortfolioGuardian. If it requires judgment, tailoring, or broader accounting/compliance work, it goes to Jaquillard Minns.**

That principle should guide:
- UX design
- form fields
- pricing rules
- routing logic
- internal follow-up workflows

---

## 26. Implementation status (codebase snapshot)

This section reflects what is **implemented today** in the repository, so the PRD stays aligned with the product. Earlier sections remain the **design intent**; where they differ, this section takes precedence for current behaviour.

### Architecture
- **Monorepo:** `apps/web` (Next.js App Router, public site + admin UI), `apps/api` (Express, public submission API), `packages/shared` (Zod schemas, types, pricing/routing rules), `packages/submission` (submit pipeline, Supabase writes, Resend notifications).
- **Database:** Supabase (Postgres + Auth + Storage) with RLS for authenticated admin access to applications and related tables.
- **Email:** Resend (`RESEND_API_KEY`, `RESEND_FROM`, optional `APPLICATION_NOTIFICATION_EMAIL` / portal setting for notification recipient).

### Public application experience
- **Routes:** `/` landing page (PortfolioGuardian client copy, Jaquillard Minns lockup, CTA), `/apply` multi-step application wizard (contact and group details, entity count, per-entity details and services, individuals, adviser, review, confirmation).
- **Submission:** Browser posts to **`POST /applications`** on the Express API; server validates with `fullApplicationSubmissionSchema`, runs `@pg/submission` (persist, pricing/routing, notification email). Submission succeeds even if email fails (error recorded in DB).
- **Browser UI metadata:** Default document title **PortfolioGuardian - Application** on public routes.

### Admin portal authentication and session
- **Supabase Auth** (email/password). Routes under `/admin` require a valid session and an **`admin_users`** row with **`is_active = true`**.
- **Pages:** `/admin/login`, `/admin/forgot-password`, `/admin/update-password` (invite/recovery set-password flow). **Auth callback** at `/auth/callback` completes magic/invite links.
- **Security UX:** After a successful password set on the invite/recovery screen, the user is **signed out** and sent to `/admin/login` so they sign in explicitly. **Idle logout** after **15 minutes** without activity (dashboard) signs out and returns to login.
- **Browser UI metadata:** Default document title **PortfolioGuardian - Application Admin Portal** for `/admin` routes.

### Admin portal features
- **Shell:** Left sidebar navigation, header with profile and sign out, Montserrat styling, PortfolioGuardian logo.
- **Applications (default dashboard):** Table of applications with reference, contact, **workflow status**, assignee, created date; stat filters (e.g. today, pending, in progress, documents sent, completed); assignment to team members.
- **Workflow statuses (canonical in UI):** `pending`, `in_progress`, `documents_sent`, `completed` (older DB labels may be normalised for display). *This differs from the illustrative status list in §9 (“New”, “Under Review”, etc.); the live workflow is the canonical set above.*
- **Application detail:** Structured review of submission, entities, services, pricing/routing, portfolio documents where present, workflow controls, assignee, audit event timeline, delete/hide application as implemented.
- **Users:** Directory with role; **Admin** users can invite (email link), remove users, and change roles (with protection for the last admin). **General user** can view the directory but cannot invite, remove, or change roles. **Status** column: **pending** (auth email not yet confirmed) vs **active**. In-app copy explains Admin vs General user capabilities.
- **Audit Log:** Page listing **application audit events** (as stored in the database).
- **Settings:** Configure **notification recipient email** for new-application emails via `portal_settings` (with server default from environment when unset).
- **Report:** Placeholder page (“under construction”).

### Data model and storage (high level)
- Tables include **`applications`**, **`application_entities`**, **`entity_services`**, **`application_pricing_summary`**, **`application_audit_events`**, **`portal_settings`**, **`admin_users`**, plus migrations for individuals/adviser fields, form submission snapshots, portfolio document metadata, and Storage policies.
- **Portfolio files:** Private Storage bucket for uploaded portfolio reports (PDF/Excel/CSV etc.) associated with entities where the flow is enabled.

### Gaps and drift vs earlier PRD sections
- **Admin API:** Express routes under `apps/api` for admin applications are **stubs**; real admin operations use **Next.js + Supabase**, not the illustrative Express `PATCH /admin/...` list in §19.
- **Statuses:** Operational workflow uses the four states above, not the longer §9 suggestion list (unless extended later).
- **Dashboard “queues”:** PG Review / JM Referral / Manual Review as separate nav items are **not** implemented as such; triage relies on list filters, routing fields, and manual review flags in data.
- **Form stack:** Multi-step UI uses the shared application form module with Zod; **React Hook Form** appears in minor components, not necessarily the main wizard (see codebase for detail).
- **Save and resume:** No persistent “save and return later” for applicants unless added later.

### Deployment and domains
- Production typically uses a dedicated hostname (e.g. `applications.portfolioguardian.com.au`) with environment variables such as **`NEXT_PUBLIC_SITE_ORIGIN`** and related URLs for Supabase redirect allowlists and email links.

