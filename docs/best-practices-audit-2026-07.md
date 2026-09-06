# Best-Practices & Security Audit — unified-crm-finance (ERP/CRM)

**Date:** 2026-07
**Scope:** `apps/web` (Next.js 16.2.9, React 19, Prisma 6.6.0, PostgreSQL) — full source audit;
`apps/worker` (Python FastAPI) — dependency check only (`pip check`);
repo root `package.json` — `npm audit` only.
**Method:** static analysis of every `src/app/api/**/route.ts` (141 route files), auth/security libs, config, and dependency audits. No feature code was modified; only 6 obvious debug `console.log` lines were removed (listed in §6).
**Build health:** `tsc --noEmit` — **0 errors**. Vitest — **84/84 passed** (8 files).

---

## Executive summary

The app is in generally good structural shape (Prisma everywhere, no raw SQL, no XSS sinks, secrets out of the repo, prior IDOR fixes verified), but it has **one systemic authorization gap**: `src/middleware.ts` only verifies JWT *validity* for `/api/*` — it does not apply section-RBAC or user-status checks to API routes (the code's own comment in `src/lib/auth/permissions.ts:38-43` documents this). Authorization therefore lives 100% in each route handler, and a large share of handlers skip it:

- **35 route files (~100 handlers)** have no session/ownership/RBAC check at all — reachable by *any* authenticated user of *any* role, including deactivated users with unexpired cookies.
- **15 `[id]` GET handlers** have zero checks while their PATCH/DELETE siblings are properly gated (IDOR-on-read of financial data).
- **14 collection GETs** return org-wide data dumps (deals, projects, contracts, contacts incl. passport/bank details, counterparties, bank statements, webhook secrets) to any authenticated user.
- Several handlers check session presence only (`if (!session)`) without any ownership comparison, including `PATCH /api/contracts/[id]` and `POST /api/deals/[id]/move`.

**Severity totals (security findings): 0 critical · 47 high · 28 medium · 16 low** (each finding = one code location; families counted per route/handler). Plus dependencies: 0 critical, 11 high, 4 moderate in `apps/web`; 0 critical, 5 high, 4 moderate at repo root (dev tooling only).

**Prior-review items re-checked:** ✅ dedupeKey duplicate notifications — FIXED (`src/lib/notifications/events.ts:39-46` filters by the dedicated `dedupeKey` column); ✅ notifications IDOR — FIXED (`api/notifications/route.ts:19-20,60-65`, `api/notifications/[id]/route.ts:37-41,65-69`); ✅ tasks IDOR — FIXED (`api/tasks/route.ts:26-68`, `api/tasks/[id]/route.ts:24-30,65-71`); ✅ analytics RBAC hole — FIXED for non-viewAll roles (`analyticsManagerScope` applied in `api/analytics/funnel/route.ts:29-32` and siblings) — but with a new admin blind spot, see §1.1.5.

---

## 1. Security

### 1.1 Authorization on API routes (critical area)

**Context.** `src/middleware.ts:41-48` — for `/api/*` the middleware checks only that the JWT is cryptographically valid (signature, issuer, audience, expiry). Section-RBAC (`middleware.ts:69-75`) runs **only for pages**. `isActive`/`deletedAt` are *not* checked in middleware (`middleware.ts:37-38`) — that check exists only in `getSession()`, which many routes never call. Consequence: any valid cookie of any role (even a deactivated employee's) passes middleware for every API endpoint.

#### 1.1.1 Family A — route files with NO auth check at all (35 files)

These handlers call no session helper whatsoever; middleware is their only gate. All line numbers below are handler-export lines.

| Route | Severity | Impact |
|---|---|---|
| `api/accounting/pnl/route.ts` GET:24 | **high** | Org P&L (income/expense/net profit) for any period. Bonus bug: invalid `period` silently drops the date filter (lines 29-33) → aggregates **all** transactions ever (unbounded query). |
| `api/accounting/plan-fact/route.ts` GET:21 | **high** | Plan-vs-actual per category; `projectId` fully caller-controlled (lines 53, 71) — IDOR on financials. |
| `api/accounting/cashflow/route.ts` GET:26 | **high** | Org-wide cash-flow plan/fact. |
| `api/invoices/[id]/approve/route.ts` POST:14 | **high** | Approves any invoice (financial workflow). |
| `api/invoices/[id]/status/route.ts` PATCH:18 | **high** | Arbitrary invoice status transition. |
| `api/invoices/[id]/recompute/route.ts` POST:16 | **high** | Recomputes any invoice's verification state. |
| `api/invoices/items/[id]/route.ts` PATCH:15, DELETE:42 | **high** | Update price/qty or hard-delete any invoice line; DB layer has no status/ownership precondition (`lib/db/invoices.ts:262-271`). |
| `api/invoices/items/[id]/match/route.ts` POST:15 | medium | Fakes verification matches (drives verified/discrepancy). |
| `api/invoices/items/[id]/unmatch/route.ts` POST:14 | medium | Breaks match links (verification sabotage). |
| `api/invoices/[id]/items/route.ts` GET:15, POST:32 | **high** | Read/add items on any invoice; client sets `isMatch`/`bomItemId` itself (lines 49-51). |
| `api/designer-bonuses/[id]/mark-paid/route.ts` PATCH:14 | **high** | Marks any designer bonus paid (payroll). |
| `api/projects/[id]/designer-bonus/route.ts` GET:17, PUT:34 | **high** | Upserts bonus (percent/amount) for any project; `designerId` client-supplied (line 43). |
| `api/projects/[id]/complete/route.ts` POST:26 | **high** | Closes any project + cascades deal closure; `userId` actor is client-supplied (line 35) and written into DealHistory — actor spoofing; `overrideUnmet` also client-controlled (line 46). |
| `api/projects/[id]/stages/[stageId]/route.ts` PATCH:11 | **high** | Edits dates/status of any project stage. |
| `api/warehouse/[id]/transactions/route.ts` POST:16 | **high** | Applies stock transactions (in/out/reserve) to any warehouse item. |
| `api/bom/[id]/unlock/route.ts` POST:23 | **high** | Unlocks any BOM — direct bypass of the lock integrity control (`lib/db/bom.ts:134-139`, no precondition/audit). |
| `api/bom/[id]/lock/route.ts` POST:23 | medium | Locks any BOM (edit-denial sabotage). |
| `api/bom/[id]/items/route.ts` GET:25, POST:70 | medium | Read/add items to any unlocked BOM (feeds purchase specs). |
| `api/approvals/route.ts` GET:12, POST:29 | **high** | Lists all approval requests; POST accepts client-supplied `requestedBy`/`notifyUserId` (identity forgery). DB layer `ensureUser()` **upserts arbitrary user rows** with `passwordHash: 'dev-no-auth'` (`lib/db/approvals.ts:51-63`) — user-table pollution on a production code path. |
| `api/approvals/[id]/decide/route.ts` POST:15 | **high** | Approves/rejects any approval request; `decidedBy` client-supplied (line 22-31). |
| `api/contracts/[id]/documents/package/route.ts` GET:23 | **high** | Renders full docx ZIP for any contract embedding client PII (passport series/number/issuer, INN/KPP/OGRN, bank account, address, phone/email — lines 44-66). No rate limit + heavy rendering → also a DoS vector. |
| `api/contracts/[id]/documents/sale-contract/route.ts` GET:15 | **high** | Same PII block in sale-contract docx. |
| `api/contracts/[id]/signers/route.ts` GET:24, POST:48 | medium | Read/add signers to any contract; `signatureFileId` client-supplied (line 77) — fake signature records. |
| `api/contracts/[id]/versions/route.ts` GET:24, POST:48 | medium | Append contract versions with client-supplied `createdBy` (lines 64-69, 80-85) — forged authorship in legal history. |
| `api/purchase-requests/[id]/send/route.ts` POST:15 | medium | Flips any draft PR to `sent` + writes EmailLog — procurement workflow hijack; no real mailer exists (see §3.4). |
| `api/purchase-requests/[id]/resend/route.ts` POST:15 | medium | Fabricates outbound email trail; can regress `responded` → `sent` (`lib/db/purchase-requests.ts:297-336`). |
| `api/purchase-requests/[id]/items/route.ts` GET:15, POST:32 | medium | Add items incl. prices to any PR; no status check (`purchase-requests.ts:361-368`). |
| `api/purchase-requests/[id]/generate-email/route.ts` POST:15 | low | Regenerates + persists email text on any PR. |
| `api/projects/[id]/acceptance-act/route.ts` GET:18, POST:35 | medium | Create acceptance acts for any project; signer/method client-controlled (lines 43-48); existence oracle. |
| `api/projects/[id]/change-orders/route.ts` GET:15, POST:32 | medium | Create change orders with arbitrary amount — inflates project financials. |
| `api/projects/[id]/installations/route.ts` GET:15, POST:32 | medium | Create installations (cost/advance) for any project. |
| `api/projects/[id]/payments/route.ts` GET:16, POST:34 | medium | GET has a **write side effect** (auto-creates 70/30 payment stages, line 23); POST sets arbitrary payment schedule. |
| `api/projects/[id]/productions/route.ts` GET:28, POST:74 | medium | Create productions; free-form `attributes` JSON (line 101). |
| `api/productions/[id]/stages/route.ts` GET:24, POST:58 | medium | POST spreads the **entire body** into `createStage` (lines 91-94) — mass assignment incl. `id`/`createdAt`/`status`. |
| `api/contacts/[id]/interactions/route.ts` GET:25 | medium | Full interaction timeline of any contact; unpaginated. |
| `api/projects/[id]/history/route.ts` GET:14 | low | Status history of any project. |
| `api/projects/[id]/closure-readiness/route.ts` GET:20 | low | Closure checklist of any project. |
| `api/projects/[id]/payments/coverage/route.ts` GET:15 | low | Payment coverage of any project. |
| `api/purchase-requests/group/route.ts` GET:12 | low | Supplier grouping preview (locked BOMs only). |
| `api/bom/coverage-map/route.ts` GET:13 | low | Coverage map; `projectIds` unbounded (no cap on `in` query). |
| `api/lead-sources/route.ts` GET:13, `api/pipelines/route.ts` GET:10, `api/pipelines/[id]/route.ts` GET:10 | low | Reference dictionaries. |

#### 1.1.2 Family B — `[id]` GET without any check (IDOR-on-read), while siblings are gated

Same file, same entity: PATCH/DELETE check `canModify(...managerId)`, but GET returns the full record to anyone:

`budgets/[id]:31-65` · `bom/[id]:32-73` (prices) · `bom/items/[id]:32-66` (price) · `cashflow-payments/[id]:25-41` · `invoices/[id]:32-46` (invoice+supplier+project+items) · `purchase-requests/[id]:20-41` · `deliveries/[id]:19-37` · `installations/[id]:19-40` (advance/cost) · `change-orders/[id]:19-40` · `counterparties/[id]:30-74` (incl. related invoices/deliveries) · `contracts/[id]:28-72` (full contract+contact+versions+signers) · `finance/statements/[id]:17-38` (bank statement; DELETE is admin-gated, GET is open) · `warehouse/[id]:18-38` (stock+history) · `stages/[id]:28-52` · `categories/[id]:30-64`. **Severity: high** (13 routes), low for the two reference-data routes.

#### 1.1.3 Family C — collection GETs returning org-wide data (no check, no scoping)

`api/deals/route.ts:26-102` (all deals, amounts, contacts, manager emails) · `api/projects/route.ts:28-93` (all projects, stages, member names/emails) · `api/contracts/route.ts:23-66` · **`api/contacts/route.ts:15-53` — full client PII: passport series/number/issuer, bank accounts, INN/KPP/OGRN, phones, emails, addresses** · `api/budgets/route.ts:27-78` · `api/bom/route.ts:24-56` · `api/cashflow-payments/route.ts:18-56` · `api/invoices/route.ts:15-28` · `api/purchase-requests/route.ts:14-30` · `api/deliveries/route.ts:14-30` · `api/counterparties/route.ts:23-58` (bankAccount/BIC/corr account/INN) · `api/webhooks/route.ts:13-24` (**returns subscription `secret` values and delivery logs with payloads/response bodies** to any authenticated user) · `api/files/route.ts:148-173` (all file metadata incl. `storageKey`, `uploadedBy`). **Severity: high** (11), webhooks high, files/warehouse medium, categories low. Most are paginated (50-100/page) so exfiltration takes paging, but there is no access restriction.

#### 1.1.4 Family D — session-presence-only (no ownership/RBAC comparison)

- `api/contracts/[id]/route.ts` PATCH:79-124 — `if (!session)` only (lines 86-89); any authenticated user edits any contract incl. `amount`, `status`, `signedAt`. DELETE in the same file is admin-only (lines 139-144) — the gap is the PATCH. **high**
- `api/deals/[id]/move/route.ts` POST:30-71 — `requireSession()` only; no `managerId` check; any user moves any deal to any stage (incl. won/lost). **high**
- `api/interactions/route.ts` GET:25-50 — `if (!session)` only; returns **all** interactions (call/email subjects and content) regardless of author. **medium**
- `api/deals/[id]/comments/route.ts` GET:17-31 — deal existence checked, ownership never compared; POST:41-74 likewise un-gated. **medium**
- `api/deals/[id]/contacts/route.ts` GET:22-35, POST/DELETE:45-127 — same pattern. **medium**
- `api/search/route.ts` GET:31-55 — deals (38-43) and projects (44-49) are managerId-scoped, but contacts (32-37) and contracts (50-55) are **not** — cross-tenant contact/contract search. **medium**
- `api/search/entities/route.ts` — same gap for contact/counterparty/contract types (82-104, 135-152, 175-209); additionally the `ids=` resolution for project (220-225) and deal (293-298) ignores `managerScope`. **medium**

#### 1.1.5 Analytics RBAC — prior hole fixed, with two caveats

- ✅ `analyticsManagerScope(session)` is applied in `funnel` (29-32), `margin`, `cashflow`, `budget-vs-actual` (which additionally 403s on `project.managerId` mismatch), `transactions-summary`; `team-performance` is director/admin-only; `procurement-metrics` is director/supply.
- ⚠️ **Admin blind spot:** `src/lib/auth/analytics-rbac.ts:28-33` treats `['director','technologist','supply','accountant']` as view-all but **omits `admin`** — an admin-only user falls into `return session.id` (line 34) and sees only their own projects, contradicting `ROLE_MATRIX` (`roles.ts:35-39`, admin `viewAllProjects: true`). The test suite has no admin case (`__tests__/auth/analytics-rbac.test.ts`). **medium (functional bug)**
- ⚠️ The view-all role list is hardcoded in `analytics-rbac.ts` instead of deriving from `ROLE_MATRIX` — the exact kind of duplication that caused the original hole. Recommend a single source of truth.

#### 1.1.6 Public-by-design routes (verified acceptable)

- `api/health` (public) — safe; its only `$queryRaw` is a literal `SELECT 1` (`health/route.ts:36`), no injection.
- `api/auth/login` — rate-limited (5/min/IP, `login/route.ts:12-26`), generic 401, checks `isActive`/`deletedAt` (47-48). Good.
- `api/auth/logout` — cookie clear only. Fine.
- ⚠️ `api/files/download` is in middleware `PUBLIC_PREFIXES` (`middleware.ts:13`) — **unauthenticated** file download by `storageKey`. Path traversal is guarded (`files/download/route.ts:19-28`), but any local file (`STORAGE_LOCAL_DIR`, default `.local-uploads`) is fetchable by anyone who knows/guesses the key; keys are structured `entityType/entityId/timestamp-sanitized-name` (`lib/storage/s3.ts:151-160`) — entity ids are UUIDs, so guessing is hard but the endpoint has zero access control. In S3 mode presigned URLs are issued after `canModify` (`files/[id]/route.ts:43-56`), so prod is better; local mode (dev) is open. **medium**
- ⚠️ `POST /api/files` allows `image/svg+xml` (`files/route.ts:25`); downloaded SVGs are served inline as `image/svg+xml` from the app origin (`files/download/route.ts:43`) — a stored-XSS vector if a victim opens an attacker-uploaded SVG URL. **medium**

### 1.2 Secrets & keys

- ✅ No hardcoded passwords/tokens/API keys found in `apps/web/src` (grep for `password|secret|token|api_key|access_key` assignments and `PRIVATE KEY|BEGIN RSA|AKIA…|sk-…` patterns — zero hits outside env-var reads).
- ✅ `apps/web/.env` exists but is git-ignored (`.gitignore:15`) and not tracked; only `.env.example` is tracked.
- ✅ `AUTH_SECRET` is required at module load (`lib/auth/jwt.ts:3-5`). Minor: no minimum-length check — a short secret is silently accepted. **low**
- ⚠️ `docker-compose.yml:7-10` — Postgres with default `postgres/postgres` credentials and port `5432` published to all interfaces. Fine for dev; dangerous if the compose file is ever used in production. **low**
- ⚠️ `lib/auth/rate-limiter.ts:74-79` — `getClientIP()` trusts `X-Forwarded-For` unconditionally; if the app is ever reachable without a proxy that overwrites XFF, the login rate limit is trivially bypassed (spoof header per attempt). Also the limiter is in-memory (per-process), so multi-instance deployments don't share limits. **low**

### 1.3 SQL injection / raw queries

- ✅ Only one `$queryRaw` in the codebase: `SELECT 1` in the health check (`api/health/route.ts:36`) — literal, safe. Everything else is Prisma's parameterized API. No injection found.

### 1.4 XSS sinks

- ✅ Zero `dangerouslySetInnerHTML`, `.innerHTML=` or `document.write` in `apps/web/src`.
- ⚠️ `lib/email/sender.ts:96-105` — `notificationEmailTemplate()` interpolates `title`/`message` into HTML unescaped; notification titles are user-controlled via `POST /api/notifications` (directors can target other users). HTML injection in outbound email. **low**
- ⚠️ SVG upload → inline serve (see §1.1.6). **medium**

### 1.5 Cookies / JWT / CORS

- ✅ Session cookie: `httpOnly: true`, `secure` in production (overridable via `SESSION_COOKIE_SECURE=false`), `sameSite: 'lax'`, `path: '/'`, 7-day expiry (`lib/auth/cookies.ts:4-14`). Good.
- ✅ JWT: HS256, issuer + audience verified, 7d expiry (`lib/auth/jwt.ts`). Roles in the token are **re-read from DB** by `getSession()` (`session.ts:35-41`), so role changes take effect server-side; middleware (Edge) still uses token roles for *page* routing until re-login — cosmetic only. **low**
- ✅ CSRF: cookie auth + `SameSite=Lax` blocks cross-site POSTs; no CORS headers configured (same-origin SPA) — fine unless the API will be consumed cross-origin (then add an explicit allow-list).
- ⚠️ No security headers anywhere: no CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` in `next.config.ts` (11 lines, no `headers()` config) or middleware. **medium**

### 1.6 Source maps

- ✅ `next.config.ts` sets no `productionSourceMaps`; Next.js production default is no source maps. No exposure.

### 1.7 Error-message information disclosure

~110 API route files return raw `error.message` to the client on 500 (`message: error instanceof Error ? error.message : …`). Representative examples: `api/notifications/route.ts:39`, `api/tasks/route.ts:116`, `api/projects/route.ts:89`, `api/deals/route.ts:98`, `api/contacts/route.ts:51`, `api/finance/statements/[id]/route.ts:34`, `lib/api/error-mapping.ts:98-99`, plus all 35 Family-A files. Notable variants: `api/projects/[id]/complete/route.ts:63-88` returns `error.message` on the 500 fallback; `api/files/route.ts:108-117` and `files/[id]/route.ts:68-79` leak storage/S3 SDK error text; `org/templates*`, `org/functions*`, `org/departments*`, `org/assignments*` pass through raw messages with an unbounded `error.statusCode`. No route returns the raw Prisma error object (checked). Prisma error messages can include query fragments/constraint names. **medium** (systemic; fix once via a shared error mapper that logs server-side and returns a generic 500 body — `lib/api/error-mapping.ts` already sanitizes P2002/P2003/P2025 and is the right place).

### 1.8 Other security notes

- ⚠️ **`bcryptjs` is declared in `devDependencies`** (`apps/web/package.json:38`) but is a **runtime** dependency (`lib/auth/password.ts:1` — login hashing). A production install with `npm ci --omit=dev` breaks login. **high (operational)**
- ✅ `files/[id]` download uses `canModify(uploadedBy)`; upload sets `uploadedBy = session.id`, ignoring client input (`files/route.ts:63-64`). Good.
- ⚠️ `webhookDispatcher` is in-memory (`lib/webhooks/dispatch.ts:34-36`) — subscriptions reset on restart (functional gap, not security); subscription creation is settings-gated, but the GET leak (§1.1.3) exposes `secret` and delivery payloads.
- ⚠️ Webhook dispatch fetches arbitrary `sub.url` (SSRF-shaped) — mitigated because only admin/director can create subscriptions (settings section).

---

## 2. Dependencies

### 2.1 `apps/web` — `npm audit` (full): 0 critical · 11 high · 4 moderate (15 total)

Direct dependencies needing attention:

| Package | Installed | Severity | Notes |
|---|---|---|---|
| `next` | ^16.2.9 | **high** | Multiple advisories fixed in **16.2.11**: middleware/proxy bypass, DoS in Server Actions, SSRF in server actions & rewrites, cache confusion, unbounded Server Action payload, Image-Optimization SVG DoS, unauthenticated disclosure of internal Server Function endpoints. **Update to `next@16.2.12`.** |
| `xlsx` | 0.18.5 | **high** | Prototype Pollution + ReDoS (SheetJS). The npm package is **abandoned — no fixed version exists on npm** (latest is still 0.18.5). Only the SheetJS CDN distribution is patched. Mitigations: move parsing to the worker/server, pin to the CDN tarball, or migrate to a maintained library (`exceljs`). |
| `postcss` | 8.5.15 (dev) | **high** | XSS via unescaped `</style>` and arbitrary file-read via attacker-controlled `sourceMappingURL` — fixed in **8.5.28**. Update. |
| `@tailwindcss/postcss` | 4.3.1 (dev) | moderate | via postcss; fixed by **4.3.3**. |

Transitive (fix via `npm update`/overrides): `sharp` (<0.35.0, libvips CVEs), `undici` 7.x (<7.29.0 — response desync, CRLF injection, cookie attribute injection), `js-yaml` (<4.3.1 quadratic CPU), `brace-expansion` (exponential DoS), `browserslist` (OOM), `fast-uri` (SSRF via host confusion), `ip-address` (SSRF bypass), `nanoid` (<3.3.18), `qs` (<6.16.0 DoS), `hono`/`@hono/node-server` (via prisma CLI dev tooling — several moderate).

`npm audit --omit=dev`: **0 critical · 11 high · 3 moderate** (drops one moderate; `postcss`/`@tailwindcss/postcss` are dev-only, but `next` and `xlsx` remain — runtime-relevant).

### 2.2 Repo root — `npm audit`: 0 critical · 5 high · 4 moderate (9 total)

Root `package.json` pins `prisma`/`@prisma/client` 6.6.0. All advisories are in **Prisma CLI's dev tooling** (`@prisma/config` → `deepmerge-ts`, `@prisma/dev` → `hono`, `mysql2` auth-plugin downgrade/decompression DoS, `valibot`) — build-time risk only, not shipped to production runtime. Update `prisma` to a patched 6.x when available; low urgency.

### 2.3 `apps/worker` (Python) — `pip check`: 2 conflicts, 0 missing packages

- `langchain 0.3.7` requires `numpy<2.0.0,>=1.26.0`, but `numpy 2.5.1` is installed.
- `litellm 1.87.0` requires `openai<3.0.0,>=2.20.0`, but `openai 1.109.1` is installed.

Both are real solver conflicts that can cause runtime breakage in the worker; pin/upgrade the involved packages. (Full `pip-audit`/`pip list --outdated` not run — out of quick-scope.)

No `npm audit fix` was run, per instructions (report only).

---

## 3. Code quality

### 3.1 console.* census

**286 console statements across 161 files** in `src` (tests excluded): ~270 `console.error`, 11 `console.log`, 5 `console.warn`. All 270 `console.error` calls were verified to be in `catch` blocks, `.catch()` callbacks, error boundaries, or the error-mapping helper — no error logs in normal flow. `console.warn` uses (files MIME guard, deal fallbacks, upload max-files) are legitimate.

Top per-file counts: `project-gantt.tsx` 7 → now 2 after removals; `deal-contacts-section.tsx` 6; `lib/email/sender.ts` 5; `tasks/route.ts` 5; `production-detail-card.tsx`, `files/route.ts`, `files/[id]/route.ts`, `change-order-list.tsx`, `deals/page.tsx`, `s3.ts` — 4 each.

Remaining `console.log` (not removed, with reason):
- `lib/email/sender.ts:77` — SMTP stub marker; tied to the stub bug in §3.4 (fix the stub, not the log).
- `lib/email/sender.ts:82-85` — intentional `provider: 'log'` dev fallback (documented in file header). Note it prints up to 200 chars of email body (potentially client PII) to server logs in dev. **low**

All `console.error` calls found in `catch` blocks were left in place per audit rules (e.g. `src/app/(app)/projects/[id]/page.tsx:171,174,299`, `project-gantt.tsx` error paths). The `[ProjectDetail]` perf-logging lines mentioned in the audit brief are no longer present as `console.log` — the remaining ones are error-path logs.

### 3.2 Dead code (grep-verified: zero imports/callers anywhere in src)

1. `src/lib/email/sender.ts:96` — `export function notificationEmailTemplate()` — never imported (also the unescaped-HTML concern in §1.4).
2. `src/lib/email/sender.ts:91` — `export const emailSender` (the default 'log' singleton) — never imported.
3. `src/lib/db/warehouse.ts:124` — `findLowStock()` — never called.
4. `src/lib/db/approvals.ts:141` — `findPending()` — never called.
5. `src/lib/db/bank-statements.ts:85` — `findBankTransactions()` — never called.
6. `src/app/(app)/projects/[id]/page.tsx:2` — `export const dynamic = "force-dynamic"` in a `"use client"` file is a no-op. **low**

Report only — nothing deleted (per audit rules).

### 3.3 Missing pagination — 19 unbounded collection GETs

`GET /api/tasks` (`lib/db/tasks.ts:80-85`) · `GET /api/org/tasks` (`tasks.ts:228-236`) · `GET /api/counterparties` (`counterparties/route.ts:38-41`; repo supports take/skip but route doesn't use it) · `GET /api/contracts` (`contracts/route.ts:35-44`) · `GET /api/categories` (`categories/route.ts:49-55`, dictionary) · `GET /api/interactions` (`interactions/route.ts:38-40`) · `GET /api/invoices` (`invoices/route.ts:18-23`) · `GET /api/deliveries` (`deliveries/route.ts:17-21`) · `GET /api/purchase-requests` (`purchase-requests/route.ts:17-21`) · `GET /api/warehouse` (`warehouse/route.ts:17-20`; lowStock loads all rows then filters in JS) · `GET /api/approvals` (`approvals/route.ts:15-18`) · `GET /api/users` (`users/route.ts:20-31`) · `GET /api/users/list` (`users/list/route.ts:24-32`) · `GET /api/lead-sources` · `GET /api/pipelines` · `GET /api/finance/statements` (`bank-statements.ts:78-83`) · `GET /api/budgets` (`budgets/route.ts:37-55`) · `GET /api/transactions` and `GET /api/cashflow-payments` (support optional skip/take but **no default limit**).

Properly paginated for contrast: projects, deals, contacts (page/pageSize, cap 100), files (default 50), notifications (default 50), search (take 200). Nested per-parent lists (`projects/[id]/productions`, `bom/[id]/items`, …) are bounded by parent id but have no `take` — flag if parents can grow large. **medium** overall.

### 3.4 N+1 query patterns (server + client)

1. `src/lib/db/deliveries.ts:158-179` — `updateWarehouseFromInvoice`: per invoice line → 2× `warehouseItem.findFirst` + `create` + `applyTransaction` (which opens its own `$transaction`). ≈5-6 queries per line. **medium** — strongest server-side case.
2. `src/lib/db/purchase-requests.ts:193-199` — `groupBOMBySupplier`: `counterparty.findUnique` per supplier; fix with one `findMany({ id: { in: [...] } })`. **low-medium**
3. `src/lib/db/task-templates.ts:211-243` — `materializeInstances`: per-template `findMany` + assignee resolve + `$transaction`; runs on every `GET /api/tasks` and `/api/org/tasks` (fire-and-forget). **medium**
4. `src/app/api/tasks/route.ts:84-110` — every tasks GET triggers per-task notification writes (dedupe `findFirst` + `create` each) and a project-deadline sweep; dedupeKey keeps it correct but it's per-request load on a hot endpoint. **medium**
5. Client: `contracts/page.tsx:154-156` and `projects/page.tsx:206-208` — sequential `DELETE` per selected id in bulk delete (no bulk endpoint). **medium (user-visible)**
6. Client: `deal-contacts-section.tsx:177-185` — one POST per employee for auto-import; `procurement/purchase-requests/[id]/page.tsx:161-168` — one PATCH per match row. **low-medium**
7. Verified NOT N+1 (correctly batched): `approvals.ts:128-133` (single `findMany in`), `search/entities` (parallel pairs), `invoices/[id]/pay`, `debts.ts`.

### 3.5 Functional bugs worth knowing (flagged, not fixed)

- **SMTP email stub lies:** `lib/email/sender.ts:74-79` — `sendViaSmtp()` logs "Would send" and returns `{ success: true }` without sending anything; the default singleton is `provider: 'log'` (line 91). Purchase-request `send`/`resend` therefore record "sent" EmailLogs while **no email ever reaches the supplier**. **high (functional)**
- `ensureUser` dev shim (§1.1.1) writes `passwordHash: 'dev-no-auth'` rows — not loginable (bcrypt.compare against a non-hash fails), but pollutes the users table and forges requester identity.
- `GET /api/accounting/pnl` invalid-`period` → unbounded full-history aggregation (§1.1.1).

---

## 4. Performance / compatibility

### 4.1 Client components refetching lists on every dialog open

- `src/components/projects/create-production-modal.tsx:87-100` — fetches the **entire supplier list** on every open, only to derive skill badges (lines 119-122); the actual picker is server-side search (`EntitySearchSelect`, line 222) — the full-list fetch is nearly redundant. **medium**
- `src/components/procurement/delivery-create-dialog.tsx:52-58` — `getInvoices()` (all invoices, unpaginated) on every open. **medium**
- `src/components/procurement/approval-create-dialog.tsx:41-47` — `getInvoices({status:"approved"})` on every open. **medium**
- `src/components/finance/transaction-form.tsx:57-79` and `category-form.tsx:49-73` — `getCategories()` on every open. **low-medium**
- `src/components/deals/create-deal-modal.tsx:85-91` — `getLeadSources()` on every open (small list). **low**
- `src/components/ui/entity-search-select.tsx:123-135` — debounced `/api/search/entities` on every popup open, plus a label-resolve fetch (92-120); embedded in many dialogs → 2+ uncached requests per open. **medium** (fix: cache the label map, reuse one fetch per mount).
- `src/components/notification-bell.tsx:38-43` — polls `/api/notifications` every 30s, mounted globally in `topbar.tsx:106`. **low**
- `src/components/procurement/purchase-request-create-dialog.tsx:58-74,86-93` — up to 2 sequential API calls **per BOM item** on "Preview" → request storm on large BOMs. **medium (N+1 on client)**
- `src/components/deals/deal-contacts-section.tsx:171` — fetches all person contacts, filters client-side. **low**

### 4.2 Missing `key` props (spot-check of 60+ `.map()` sites)

- `src/components/procurement/invoice-upload-dialog.tsx:148-149` — `key={idx}` on an editable line-item list with per-row deletion (line 173) → stale input values after deleting a middle row. **Real bug — needs a stable generated id.**
- `src/components/procurement/counterparty-history.tsx:36-37` — index fallback key (static table, low risk).
- `src/app/(app)/org/templates/rrule-builder.tsx:269` — `key={i}` on static preview badges (low risk).
- DnD lists are clean (kanban keyed by `deal.id`, stages by `stage.id`).

### 4.3 Deprecated / unsafe patterns

- ✅ Re-verified: `dangerouslySetInnerHTML` = 0, `document.write` = 0, `eval(` = 0, `new Function(` = 0, `innerHTML` = 0 across `src`.
- `src/lib/api/files.ts:106-129` — `XMLHttpRequest` for upload progress. Legacy but justified (fetch has no upload-progress API). Informational.
- `localStorage` only for sidebar-collapse UI state (`components/layout/sidebar.tsx:35-42`). ✅ No tokens stored client-side.

### 4.4 Images

No `next/image` usage; 4 raw `<img>` in fixed-size containers (logo/avatars/thumbnails) — low CLS risk. Only `shared/file-preview.tsx:123-128` (dialog preview, no dimensions, `min-h-[400px]` container) can shift while loading. **low**

### 4.5 Client bundle red flags

- `src/components/projects/project-gantt.tsx:4-5` — static `import { Timeline } from "vis-timeline/standalone"` + `vis-data` in a client component, statically imported into `projects/[id]/page.tsx:10`. ~500KB+ min JS in the projects client chunk, loads before hydration. **Use `next/dynamic(..., { ssr: false })`.** **medium-high**
- `src/components/procurement/bom-section.tsx:243-271` — client-side Excel parsing via `await import("xlsx")` (line 246); BOMSection is statically imported into `projects/[id]/page.tsx:22` → xlsx (~800KB min) becomes a client chunk. **Move Excel parsing to a server API route.** **medium-high**
- `src/components/layout/topbar.tsx:11` / `sidebar.tsx:14` — framer-motion in the app shell (every page) for pill/collapse animations achievable in CSS. **low-medium**
- ✅ `src/lib/api/*.ts` verified clean (thin fetch wrappers, no heavy imports); docx/S3/AWS libs correctly server-side only.
- Observation: `apps/web/package.json` has **no `build`/`start` scripts** (only `dev`) — production Next builds can't be produced from the standard scripts today. **low (ops)**

---

## 5. Build health

| Check | Result |
|---|---|
| `npx tsc --noEmit -p tsconfig.json` (apps/web) | ✅ **PASS — 0 errors** (run twice: before and after the console.log removals) |
| `npm test` (vitest, apps/web) | ✅ **84 passed / 84** across 8 files (auth 33, notifications 7, tasks 26, interactions 5, deals 8); 9.2s |
| `pip check` (apps/worker) | ⚠️ 2 dependency conflicts (§2.3) |

The pre-existing TS errors mentioned in the audit brief were **not present** — the tree type-checks clean.

---

## 6. Console.log lines removed by this audit

Exactly these 6 debug lines were removed (all obvious debug/perf noise; no `console.error` in catch blocks was touched):

1. `apps/web/src/components/projects/project-gantt.tsx` — `console.log("[ProjectGantt] Initializing timeline with", stages.length, "stages")` (was line 39)
2. same file — `console.log("[ProjectGantt] Drag start:", item.id)` (was line 71)
3. same file — `console.log("[ProjectGantt] Drag move:", item.id, item.start, item.end)` (was line 75 — hot path: fired on every drag-move event)
4. same file — `console.log("[ProjectGantt] Stage dragged:", item.id, "new dates:", start, end)` (was line 87)
5. same file — `console.log("[ProjectGantt] Stage updated successfully")` (was line 97)
6. `apps/web/src/app/(app)/contracts/page.tsx` — `console.log(\`[Contracts] Fetched ${response.data.length} contracts in ${duration.toFixed(2)}ms\`)` (was line 95; the now-unused `startTime`/`duration` timing lines around it were removed together)

`tsc` re-run after these edits: still 0 errors.

---

## 7. Top-10 prioritized fixes

1. **Close the authZ gap structurally.** Add a thin per-route guard (or extend middleware to a per-section allow-list for `/api/*`) so that *unchecked routes fail closed*. Concretely: for the 35 Family-A files add `requireSectionWrite(session, <section>)` on mutations and section/ownership filters on GETs (start with: accounting/*, invoices/*, designer-bonuses, approvals, bom/unlock, warehouse transactions, projects/complete, contracts documents).
2. **Scope collection GETs by role** (`deals`, `projects`, `contracts`, `contacts`, `counterparties`, `invoices`, `budgets`, …): apply `managerScope`/`ownerId = session.id` filters for non-viewAll roles, exactly like `analyticsManagerScope` — and fix the admin omission in `analytics-rbac.ts:28-34`.
3. **Fix `[id]` GET IDORs** (Family B): reuse the same `canModify` checks the PATCH/DELETE siblings already have.
4. **Fix webhook GET leak** — strip `secret` and delivery-log payloads, or gate GET behind settings/admin like POST (`webhooks/route.ts:13-24`).
5. **Upgrade `next` to 16.2.12** and **postcss to 8.5.28** (direct high-severity advisories); plan a replacement for the abandoned `xlsx` (move parsing server-side).
6. **Move `bcryptjs` to `dependencies`** in `apps/web/package.json` (runtime login dependency).
7. **Stop returning raw `error.message` on 500** — adopt one shared error mapper (extend `lib/api/error-mapping.ts` for the routes that don't use it).
8. **Replace the `ensureUser` dev shim** in `lib/db/approvals.ts:51-63` and take `requestedBy`/`decidedBy`/`notifyUserId` from the session, never from the body.
9. **Add security headers** (CSP, X-Frame-Options, X-Content-Type-Options, HSTS) via `next.config.ts` headers; serve SVG uploads as attachments or sanitize them.
10. **Fix the SMTP stub** (`lib/email/sender.ts:74-79`) so "sent" emails actually send — or make the API surface honestly report "not configured".

---

## 8. Verified-fixed prior findings & non-findings

- ✅ **dedupeKey duplicates** — fixed: `lib/notifications/events.ts:39-46` filters on the `dedupeKey` column (previously a non-working metadata filter); unit-tested (`events.test.ts:83-113`).
- ✅ **Notifications IDOR** — fixed: GET always uses `session.id`; PATCH/DELETE verify `target.userId === session.id`; non-directors cannot create for others.
- ✅ **Tasks IDOR** — fixed: list scoped to `assigneeId=session.id` for non-directors, deal/project ownership verified, PATCH/DELETE require director or assignee/creator, `createdBy` taken from session.
- ✅ **Analytics RBAC hole** — fixed for non-viewAll roles via `analyticsManagerScope` (verified in funnel/margin/cashflow/budget-vs-actual/transactions-summary) with the admin caveat in §1.1.5.
- ✅ No SQL injection (single literal `$queryRaw`), no XSS sinks (`dangerouslySetInnerHTML`/`innerHTML`/`document.write` = 0), no hardcoded secrets, `.env` untracked, source maps not exposed, cookies `httpOnly`/`secure`/`SameSite=Lax`, JWT verified with issuer/audience and DB-side role refresh, upload size/type validation present, path-traversal guarded in `files/download`.

---

## 8. Fixes applied in this session (2026-07, same iteration)

| # | Finding | Fix | File |
|---|---------|-----|------|
| 1 | Admin blind spot in analytics RBAC (admin saw only own projects) | Derive view-all from `ROLE_MATRIX.viewAllProjects` (single source of truth); added admin regression test | `src/lib/auth/analytics-rbac.ts`, `src/__tests__/auth/analytics-rbac.test.ts` |
| 2 | `GET /api/webhooks` returned subscription secrets + payload logs to any authenticated user | Now requires `settings` section (admin/director), same as POST | `src/app/api/webhooks/route.ts` |
| 3 | SVG upload → inline serve = stored-XSS vector | `image/svg+xml` removed from upload allowlist | `src/app/api/files/route.ts` |
| 4 | No security headers anywhere | Added CSP (self-only, no remote scripts), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy via `next.config.ts` `headers()`; verified live: login/deals/project pages render, 0 CSP violations in console | `apps/web/next.config.ts` |
| 5 | `bcryptjs` in devDependencies (runtime login dep — `npm ci --omit=dev` breaks login) | Moved to `dependencies` | `apps/web/package.json` |
| 6 | `ids=` resolution in `/api/search/entities` for project/deal ignored `managerScope` (cross-manager label probing) | `managerScope` applied to ids queries | `src/app/api/search/entities/route.ts` |
| 7 | Manager (ответственный менеджер) never surfaced: API returned `User`, client type expected `manager` | Mapped `User` → `manager` in project list GET, project [id] GET, and PATCH response; UI now shows/edits manager everywhere | `src/app/api/projects/route.ts`, `src/app/api/projects/[id]/route.ts` |

**Still open (prioritized backlog, see §7):** systemic API authZ (35 route files without checks, 15 IDOR-on-read GETs, 14 org-wide collection GETs incl. contacts PII), contracts PATCH / deals move session-only checks, error-message info-leak (110 routes), `xlsx` replacement (abandoned package), `next` → 16.2.12 upgrade, unbounded pagination on 19 endpoints, N+1 in deliveries.

**Verification after fixes:** `tsc --noEmit` — 0 errors · vitest — 85/85 passed (8 files, incl. new admin regression test) · live browser check on dev server: security headers served, login → deals → project page render with zero CSP violations.
