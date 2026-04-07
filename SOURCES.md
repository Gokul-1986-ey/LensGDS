# SOURCES.md — LensGDS Technology & Dependency Reference

> **LensGDS** — Value Chain Assessment & Simulation Platform
> Last updated: 2026-04-07

This document catalogs every technology, library, service, data source, and tool required to build the complete LensGDS platform. Each entry includes its current status, category, and a justification for its inclusion. This is a prescriptive reference, not a comparison guide.

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **IN USE** | Currently in the codebase and `package.json` |
| **PHASE 1** | Backend, database, auth, first agent integration |
| **PHASE 2** | Full multi-agent system, document ingestion, real-time collaboration |
| **PHASE 3** | External data integrations, peer benchmarking, ESG data |
| **PHASE 4** | C-suite export, analytics, monitoring, CI/CD hardening |

---

## Summary Table

| # | Technology | Category | Status |
|---|-----------|----------|--------|
| 1 | Next.js (App Router) | Frontend | IN USE |
| 2 | TypeScript | Frontend | IN USE |
| 3 | React 18 | Frontend | IN USE |
| 4 | TailwindCSS | Styling | IN USE |
| 5 | PostCSS | Styling | IN USE |
| 6 | clsx / tailwind-merge | Styling | IN USE |
| 7 | Zustand | State Management | IN USE |
| 8 | Zustand persist middleware | State Management | IN USE |
| 9 | React Hook Form | Forms & Validation | IN USE |
| 10 | Zod | Forms & Validation | IN USE |
| 11 | @hookform/resolvers | Forms & Validation | IN USE |
| 12 | Recharts | Visualization | IN USE |
| 13 | Anthropic Claude API | AI / LLM | PHASE 1 |
| 14 | Anthropic Claude Agent SDK | AI / LLM | PHASE 2 |
| 15 | Vercel AI SDK | AI / LLM | PHASE 1 |
| 16 | OpenAI API (fallback) | AI / LLM | PHASE 2 |
| 17 | LlamaIndex.ts / Unstructured.io | Document Ingestion | PHASE 2 |
| 18 | pdf-parse / pdfjs-dist | Document Ingestion | PHASE 2 |
| 19 | Multer / Next.js file handling | Document Ingestion | PHASE 2 |
| 20 | Next.js API Routes | Backend | PHASE 1 |
| 21 | Prisma ORM | Backend | PHASE 1 |
| 22 | PostgreSQL | Database | PHASE 1 |
| 23 | Supabase | Database / Realtime / Auth | PHASE 1 |
| 24 | NextAuth.js (Auth.js v5) | Authentication | PHASE 1 |
| 25 | bcryptjs | Authentication | PHASE 1 |
| 26 | jose (JWT) | Authentication | PHASE 1 |
| 27 | Supabase Realtime | Real-time Collaboration | PHASE 2 |
| 28 | S&P Global / Bloomberg API | External Data | PHASE 3 |
| 29 | Gartner Supply Chain API | External Data | PHASE 3 |
| 30 | Refinitiv ESG / MSCI ESG API | External Data | PHASE 3 |
| 31 | Companies House / SEC EDGAR API | External Data | PHASE 3 |
| 32 | Puppeteer / Playwright (PDF) | Export | PHASE 4 |
| 33 | PptxGenJS | Export | PHASE 4 |
| 34 | @react-pdf/renderer | Export | PHASE 4 |
| 35 | Vitest | Testing | PHASE 1 |
| 36 | React Testing Library | Testing | PHASE 1 |
| 37 | Playwright (E2E) | Testing | PHASE 2 |
| 38 | MSW (Mock Service Worker) | Testing | PHASE 2 |
| 39 | ESLint | DevOps | IN USE |
| 40 | Prettier | DevOps | PHASE 1 |
| 41 | Husky + lint-staged | DevOps | PHASE 1 |
| 42 | GitHub Actions | DevOps | PHASE 1 |
| 43 | Vercel | DevOps | PHASE 1 |
| 44 | Sentry | Monitoring | PHASE 4 |
| 45 | PostHog / Mixpanel | Monitoring | PHASE 4 |
| 46 | dotenv / .env.local | Configuration | PHASE 1 |
| 47 | @t3-oss/env-nextjs + Zod | Configuration | PHASE 1 |

---

## Frontend Framework & Language

### 1. Next.js (App Router) — IN USE

Next.js provides server-side rendering, file-based routing, and built-in API route capability within a single framework. The App Router architecture is used for nested layouts (the 5-page assessment workflow shares a common shell), server components (reducing client-side JavaScript), and will serve as the backend API layer in Phase 1 without introducing a separate server. Without Next.js, we would need to stitch together a React SPA, a separate Express server, and a build pipeline — three moving parts instead of one.

### 2. TypeScript — IN USE

The domain model in `src/types/domain.ts` spans 308 lines of interfaces covering Assessments, KPI structures, Confidence scores, Simulation parameters, and Value Chain dimensions. TypeScript makes this domain model enforceable at compile time. Every component, store action, and future API handler is typed against these interfaces. Without TypeScript, refactoring the Assessment structure (which touches every page) would be a manual, error-prone audit.

### 3. React 18 — IN USE

React is the component model underpinning Next.js. Hooks (`useState`, `useMemo`, `useCallback`) manage local UI state across the workshop, simulation, and dashboard pages. React 18's concurrent features and Suspense boundaries will be used in Phase 1 for streaming agent responses into the UI without blocking interaction.

---

## Styling

### 4. TailwindCSS — IN USE

The entire UI is built with Tailwind utility classes. A custom theme is configured in `tailwind.config.ts` for the LensGDS color system and spacing scale. Tailwind eliminates context-switching between CSS files and components, keeps styles co-located with markup, and produces a minimal production CSS bundle through tree-shaking. Switching to CSS modules or styled-components at this point would require rewriting every component.

### 5. PostCSS — IN USE

Required by TailwindCSS for CSS processing and transformation. This is a build-time dependency with no runtime footprint.

### 6. clsx / tailwind-merge (cn() utility) — IN USE

Every component uses the `cn()` helper to merge conditional Tailwind classes without conflicts (e.g., ensuring a user-passed `className` overrides a default background rather than appending a conflicting one). Without `tailwind-merge`, conditional styling would produce broken layouts from duplicate or conflicting utility classes.

---

## State Management

### 7. Zustand — IN USE

A single store (`assessment-store.ts`) manages the entire assessment lifecycle: client profile, dimension scores, confidence levels, simulation scenarios, and validation flags. Zustand was chosen over Redux because the store is a single object tree with no complex middleware chains. Zustand integrates directly with React hooks, requires zero boilerplate (no actions/reducers/dispatchers), and the entire store definition fits in one file.

### 8. Zustand persist middleware — IN USE

The persist middleware syncs the Zustand store to `localStorage`, so a partially completed assessment survives browser refresh. This is essential today because there is no backend persistence. In Phase 1, the persist target will shift from `localStorage` to Supabase via a custom storage adapter, but the middleware pattern remains the same.

---

## Forms & Validation

### 9. React Hook Form — IN USE

Manages form state for the client profile landing page (company name, industry, revenue band, assessment scope). React Hook Form avoids re-rendering the entire form on every keystroke by using uncontrolled inputs with refs. This matters because the landing page will grow to include document upload fields and additional configuration in Phase 2.

### 10. Zod — IN USE

Runtime schema validation for client profile inputs. Zod's role expands significantly in later phases: validating API request/response shapes, parsing structured JSON output from LLM agents (ensuring an agent returns a valid KPI object, not freeform text), and validating environment variables at startup. Zod was chosen over Yup or Joi because it is TypeScript-native — schemas infer TypeScript types directly, eliminating type/validation drift.

### 11. @hookform/resolvers — IN USE

Bridges React Hook Form with the Zod validation schema. Without this resolver, form validation errors from Zod would need manual wiring to form field state.

---

## Visualization

### 12. Recharts — IN USE

Used for the `KpiRadarChart` (RadarChart with 3 overlaid datasets: current, target, benchmark) and the `SimulationPage` bar charts (baseline vs. projected KPI ranges). Recharts is React-native — charts are JSX components, not imperative canvas calls. This means chart state (e.g., highlighting a KPI dimension on hover) can be driven by React state and props. Chart.js was not chosen because its imperative API does not compose naturally with React's declarative model.

---

## AI / LLM

### 13. Anthropic Claude API (claude-opus-4 / claude-sonnet-4) — PHASE 1

The primary LLM powering all 7 agents (orchestrator + 6 specialists: industry, financial, product, footprint, stakeholder, inventory). Claude is chosen for three reasons: (1) a large context window capable of ingesting full annual reports in a single call, (2) reliable structured JSON output for producing typed KPI objects and confidence scores, and (3) strong multi-step reasoning required for the orchestrator to decompose an assessment into sub-tasks and merge agent results. This is the single most critical external dependency in the system.

### 14. Anthropic Claude Agent SDK — PHASE 2

Provides the multi-agent orchestration layer for agent-to-agent communication, shared context management, and result merging across the 6 specialist agents. Without a dedicated agent SDK, orchestration logic (retries, context windowing, parallel execution, result aggregation) would need to be hand-rolled.

### 15. Vercel AI SDK — PHASE 1

Agent orchestration and streaming framework for Next.js. Provides prompt chaining, tool use, streaming responses, retry logic, and token counting. Chosen over LangChain.js because it integrates natively with Next.js App Router — agent responses stream directly into React Server Components without custom WebSocket plumbing. This integration eliminates an entire layer of streaming infrastructure.

### 16. OpenAI API (fallback) — PHASE 2

Optional secondary LLM provider for failover or cost optimization. Lower-stakes agent calls (e.g., generating follow-up questions vs. synthesizing financial insights) can route to a cheaper model. This also provides resilience if the primary Claude API experiences downtime during a live client workshop.

---

## Document Ingestion

### 17. LlamaIndex.ts / Unstructured.io — PHASE 2

Parses and extracts structured data from unstructured PDF annual reports and financial filings. Clients upload annual reports as the primary data source — without a document parsing layer, all data must be entered manually through the workshop questionnaire, which is slow and error-prone.

### 18. pdf-parse / pdfjs-dist — PHASE 2

Lightweight PDF text extraction for simpler documents that do not require the full LlamaIndex pipeline. Provides a fast path for straightforward text-heavy PDFs without the overhead of a full document intelligence service.

### 19. Multer / Next.js built-in file handling — PHASE 2

File upload middleware for the document ingestion UI. Handles multipart form data, file size limits, and temporary storage before documents are passed to the parsing pipeline.

---

## Backend & Database

### 20. Next.js API Routes — PHASE 1

Already available within the framework at `src/app/api/`. Serves as the backend layer for agent orchestration calls, database operations, authentication, and file uploads. No separate Express or Fastify server is needed, keeping the deployment surface to a single Vercel project.

### 21. Prisma ORM — PHASE 1

Type-safe database access that generates TypeScript types directly from the database schema. This aligns with the project's strong typing philosophy — the Prisma-generated types and the domain types in `src/types/domain.ts` can be kept in sync. Prisma handles migrations, complex relations (Assessment -> Dimensions -> KPIs -> ValidationLogs), and parameterized queries that prevent SQL injection.

### 22. PostgreSQL — PHASE 1

Primary relational database storing Assessments, ClientProfiles, Users, Organizations, ValidationLogs, and SimulationScenarios. PostgreSQL is chosen for ACID compliance (critical for audit trail integrity — consulting deliverables must be reproducible), native JSON column support (for storing complex nested Assessment sub-objects without over-normalizing), and a mature extension ecosystem.

### 23. Supabase — PHASE 1

Managed PostgreSQL platform that bundles three services the project needs: hosted database, real-time WebSocket subscriptions, and authentication. Supabase eliminates database operations burden (backups, scaling, connection pooling) and collapses what would otherwise be three separate services (managed Postgres + Pusher/Ably for realtime + Auth0 for auth) into one platform with a unified SDK.

---

## Authentication & Authorization

### 24. NextAuth.js (Auth.js v5) — PHASE 1

Authentication framework supporting email/password, Google OAuth, and Microsoft OAuth (consulting teams commonly use Microsoft SSO). Enforces role-based access control with three roles: Consulting Lead (full edit), Client Stakeholder (scoped edit), and Read-only Viewer. NextAuth integrates directly with Next.js middleware for route-level protection without custom guard logic.

### 25. bcryptjs — PHASE 1

Password hashing for email/password authentication flows. Bcrypt's adaptive cost factor ensures password hashes remain resistant to brute-force attacks as hardware improves.

### 26. jose (JWT library) — PHASE 1

JWT creation and verification for API route protection. The `jose` library is chosen over `jsonwebtoken` because it supports the Edge Runtime (required for Next.js middleware running on Vercel Edge Functions), whereas `jsonwebtoken` relies on Node.js-specific crypto APIs.

---

## Real-time Collaboration

### 27. Supabase Realtime — PHASE 2

WebSocket-based real-time database subscriptions enabling live workshop collaboration. Multiple participants answer assessment questions simultaneously and see confidence scores, KPI values, and validation statuses update in real time without polling. Without this, workshop sessions would require manual refresh or a separate WebSocket server (Socket.io, Pusher), adding deployment complexity.

---

## External Data Integrations

### 28. S&P Global Market Intelligence API / Bloomberg API — PHASE 3

Peer benchmarking financial data: revenue, EBIT margins, inventory turns, ROIC segmented by industry vertical and revenue band. Replaces the static benchmark arrays currently hardcoded in the assessment engine. Without real peer data, benchmark comparisons are directionally useful but not defensible in a client boardroom.

### 29. Gartner Supply Chain Research API — PHASE 3

Industry benchmark data for supply chain-specific KPIs: OTIF (On-Time In-Full) benchmarks, logistics cost as percentage of revenue, and forecast accuracy by vertical. These benchmarks calibrate 6 of the 8 core KPIs against real industry standards rather than consultant estimates.

### 30. Refinitiv ESG Data / MSCI ESG API — PHASE 3

Scope 1, 2, and 3 emissions benchmarks by industry sector. Required to calibrate the CO2 intensity KPI against actual peer emissions data. ESG reporting is increasingly mandated by regulation (CSRD, SEC climate disclosure) — consulting clients expect benchmarks grounded in reported data, not estimates.

### 31. Companies House API / SEC EDGAR API — PHASE 3

Public financial filings ingestion for publicly listed companies. Provides an automated alternative to manual PDF upload — the system can fetch a company's latest annual report directly from regulatory databases given a company identifier. Reduces friction in the assessment onboarding flow.

---

## Export & Reporting

### 32. Puppeteer / Playwright (PDF generation) — PHASE 4

Headless browser rendering of the `/export` page to a high-quality PDF for client delivery. Puppeteer handles complex layouts including Recharts SVG charts, multi-column assessment summaries, and print-specific CSS. Lightweight alternatives like `html2pdf.js` break on SVG charts and complex grid layouts.

### 33. PptxGenJS — PHASE 4

Generates PowerPoint (.pptx) slide decks from assessment data. Consulting teams deliver findings in PowerPoint, not PDF — this is a non-negotiable format requirement for C-suite presentations. PptxGenJS produces native Office XML files that clients can edit in PowerPoint after delivery.

### 34. @react-pdf/renderer — PHASE 4

React-based PDF generation providing programmatic control over PDF layout. Used for stakeholder-specific export views (CTO receives technology and product insights, CFO receives financial KPIs and ROIC analysis, COO receives operational metrics) where each view requires a different layout composed from the same underlying assessment data.

---

## Testing

### 35. Vitest — PHASE 1

Unit test runner for business-critical calculations: `runSimulation` (simulation engine math) and `answerQuestion` (confidence delta logic). These functions produce numerical outputs that consulting teams present to clients — incorrect math directly undermines credibility. Vitest is chosen over Jest for native ESM support and faster execution through Vite's transform pipeline.

### 36. React Testing Library — PHASE 1

Component-level testing focused on user behavior: answering workshop questions, observing confidence score updates, navigating the 5-page workflow. Tests assert on what users see and interact with, not implementation details.

### 37. Playwright (E2E) — PHASE 2

End-to-end tests covering the full assessment workflow: create assessment, view dashboard, complete workshop, run simulation, generate export. Catches integration failures between pages, store persistence, and API calls that unit tests cannot detect.

### 38. MSW (Mock Service Worker) — PHASE 2

Intercepts HTTP requests at the network level during tests, providing deterministic responses for LLM API calls, database queries, and external data fetches. Without MSW, tests would either make real API calls (expensive, flaky, slow) or require invasive dependency injection throughout the codebase.

---

## Developer Experience & DevOps

### 39. ESLint — IN USE

Partially configured via Next.js defaults. Enforces code quality rules and catches common errors at development time. Will be extended with project-specific rules for import ordering, unused variable cleanup, and consistent hook usage patterns.

### 40. Prettier — PHASE 1

Code formatting consistency across all contributors. Eliminates style debates in code review and ensures diffs contain only meaningful changes, not whitespace reformatting.

### 41. Husky + lint-staged — PHASE 1

Git pre-commit hooks that run linting and formatting on staged files only. Prevents malformed code from entering the repository without slowing down commits by linting the entire codebase.

### 42. GitHub Actions — PHASE 1

CI/CD pipeline: runs type-checking, linting, and tests on every pull request. Deploys to Vercel on merge to main. Provides the automated quality gate that makes test coverage meaningful — tests that are not enforced in CI are tests that will be ignored.

### 43. Vercel — PHASE 1

Deployment platform with native Next.js support. Provides preview deployments per pull request (consulting leads can review UI changes before merge), edge function support (for NextAuth middleware and API route execution close to users), and zero-configuration environment variable management.

---

## Monitoring & Analytics

### 44. Sentry — PHASE 4

Error monitoring and performance tracing in production. Tracks agent failures (LLM timeouts, malformed responses), simulation calculation errors, and confidence update bugs. Provides stack traces, breadcrumbs, and user context for every error. Without Sentry, production bugs are invisible until a client reports them during a workshop.

### 45. PostHog / Mixpanel — PHASE 4

Product analytics tracking user behavior: which insights get validated most frequently, which workshop questions are skipped, which simulation scenarios are saved vs. discarded, and where users drop off in the 5-page workflow. This data informs which agents and features to prioritize in future iterations.

---

## Configuration & Environment

### 46. dotenv / .env.local — PHASE 1

Environment variable management for LLM API keys, database connection strings, authentication secrets, and external API credentials. Next.js natively supports `.env.local` files — no additional dependency is needed, but the pattern must be established before any secrets enter the codebase.

### 47. @t3-oss/env-nextjs + Zod (env validation) — PHASE 1

Validates environment variables at application startup using Zod schemas. Prevents silent misconfiguration in production — if a required API key is missing or a database URL is malformed, the application fails fast with a clear error message instead of crashing at runtime when the first agent call is made.

---

## Dependency Count by Phase

| Phase | New Dependencies | Cumulative |
|-------|-----------------|------------|
| IN USE | 12 | 12 |
| PHASE 1 | 14 | 26 |
| PHASE 2 | 8 | 34 |
| PHASE 3 | 4 | 38 |
| PHASE 4 | 5 | 43 |

---

*This document should be updated as dependencies are added, removed, or re-phased. Every new dependency added to `package.json` must have a corresponding entry here with a justification.*
