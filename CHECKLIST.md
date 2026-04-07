# LensGDS Development Checklist

**Value Chain Assessment & Simulation Platform**

Single source of truth for project status, planned work, and contribution guidelines.
Last updated: 2026-04-07

---

## Legend

| Symbol | Meaning |
|--------|---------|
| `[x]` | Complete and shipped |
| `[ ]` | Not started / in progress |
| `[EASY]` | Self-contained, < 1 day, minimal context needed |
| `[MEDIUM]` | Requires understanding of 2-3 modules, 1-3 days |
| `[HARD]` | Cross-cutting, needs backend or architecture decisions, 3+ days |
| `[REQUIRES: X]` | Blocked by or depends on item X |

---

## How to Contribute

1. **Pick a task** from this checklist. Start with items tagged `[EASY]` if you are new to the codebase.
2. **Read the relevant files** before writing code. The codebase is compact enough to read in full, but the key files are:
   - `src/store/assessment-store.ts` — all state management and business logic (simulation engine, confidence deltas)
   - `src/types/domain.ts` — every domain type; includes unused types that are placeholders for Phase 1 agent inputs
   - `src/data/mock-data.ts` — the static dataset that agents will eventually replace (13 topics, 12 insights, 30 questions, 8 KPIs, 16 heuristics, 8 opportunities)
3. **Branch naming**: `feature/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`
4. **No tests exist yet.** If you are touching simulation math or confidence delta logic, writing a test is strongly encouraged and counts as a valid contribution on its own.
5. **UI primitives** live in `src/components/ui/`. They shadow shadcn/ui patterns but are custom-built. Do not install shadcn/ui without team discussion (see Technical Debt section).

### Good First Issues

These are self-contained, frontend-only, and require no backend or architecture decisions:

- Fix the KPI radar chart scale bug (see Bug #1 below)
- Add tooltip to disabled nav items (see Bug #2 below)
- Add per-insight progress indicator in workshop (see Bug #5 below)
- Add warning dialog before losing unsaved simulation results (see Bug #3 below)
- Add loading skeleton states to Dashboard and Workshop pages

---

## Existing Work (Complete)

### Pages (`src/app/`)

- [x] **Landing page (`/`)** — Client profile form (company name, industry, region, revenue band, description) with React Hook Form + Zod validation. Shows active assessment card if one exists. Redirects to `/dashboard` on submit.
- [x] **Dashboard (`/dashboard`)** — 4 summary stat cards (avg maturity, avg confidence, critical insights, total value at stake), maturity heatmap, KPI radar chart, top 6 insights with "Open Workshop" CTA, all 8 opportunities with "Run Simulation" CTA.
- [x] **Workshop (`/workshop`)** — 2-panel layout: insight list (12 insights with severity badge, confidence %, unanswered count) on left, InsightDetail + QuestionForm on right. Change log of last 20 answered questions. Global answered/remaining counter.
- [x] **Simulation (`/simulation`)** — Scenario name input + 13 maturity sliders (current to target). Recharts bar chart (baseline vs projected low/high). KPI detail table, tradeoff detection, saved scenarios panel with save/load/delete. Full simulation math is live.
- [x] **Export (`/export`)** — Print button, client overview, maturity table (13 topics), KPI performance table with color coding, insights list, improvement roadmap (quick-win/medium-term/strategic), validation summary (last 15 log entries), simulation scenario tables.

### Components

- [x] **NavBar** — 5 nav items with active state highlighting and disabled state when no assessment. Shows client name pill when assessment is active.
- [x] **MaturityHeatmap** — Groups 13 topics by category (plan/source/make/deliver/enable). Color-coded maturity boxes (1-5) with confidence %.
- [x] **KpiRadarChart** — Recharts RadarChart with 3 overlaid radars (current blue, target green, benchmark grey dashed). Domain 0-100. Has a known scale bug (see Bug #1).
- [x] **InsightDetail** — Displays claim, severity/category badges, confidence %, evidence/assumptions lists, financial impact, and "needs validation" warning with question count.
- [x] **QuestionForm** — Renders 5 answer types (yes-no, select-one, numeric, slider 1-5, free-text). Shows confidence delta preview. Disabled submit until value selected. Shows answered state with timestamp.

### UI Primitives (`src/components/ui/`)

- [x] Button (variants: default/outline/ghost/secondary/destructive; sizes: sm/default/lg)
- [x] Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- [x] Badge (variants: default/secondary/outline/destructive)
- [x] Input, Select, Slider, Textarea

### State & Logic (`src/store/assessment-store.ts`)

- [x] `createAssessment(profile)` — Hydrates full Assessment from mock-data.ts, links questions to insights, persists to localStorage.
- [x] `answerQuestion(questionId, answer)` — Confidence delta logic with confirmDelta/contradictDelta by answer type and question category. Updates topic confidence as average of related insight confidences. Appends to validationLog.
- [x] `runSimulation(name, topicOverrides)` — Chains maturityDelta x heuristic.perMaturityPointImprovement (low/high bounds) for each KPI. Returns SimulationScenario.
- [x] `saveScenario(scenario)` / `deleteScenario(scenarioId)` / `clearAssessment()`
- [x] Zustand persist middleware to localStorage (key: `value-chain-assessment`)

### Data (`src/data/mock-data.ts`)

- [x] 13 AssessmentTopics (with category, maturity scores, confidence, relatedKpis)
- [x] 12 Insights (severity, confidence, evidence[], assumptions[], financialImpactEstimate)
- [x] 30 ValidationQuestions across 12 insights (5 answer types, 4 question categories)
- [x] 8 KPIs with baseline/target/benchmark
- [x] 16 BenefitHeuristics (topic-to-KPI with low/high improvement per maturity point)
- [x] 8 Opportunities (effort, timeline, benefitCategory, estimatedImpact, dependencies, risks)

### Types (`src/types/domain.ts`)

- [x] Core types: ClientProfile, Assessment, AssessmentTopic, Insight, ValidationQuestion, KPI, BenefitHeuristic, Opportunity, SimulationScenario, SimulationKpiResult, SimulationTradeoff
- [x] Agent input types (defined, not yet used in UI): ClientFinancials, InventoryMetrics, Segment, Stakeholder, ProductSKU

### Utilities (`src/lib/utils.ts`)

- [x] `cn()`, `generateId()`, `maturityLabel()`, `maturityColor()`, `formatPercent()`, `confidenceColor()`

---

## Known Bugs

- [ ] `[EASY]` **Bug #1: KPI radar chart scale mismatch** — Domain is hardcoded to `[0, 100]` but KPIs use wildly different units (Inventory Turns = 4.2, CO2 = 45 tCO2e/M rev, Cost to Serve = 12%). Non-percentage KPIs render as near-zero. **Fix:** Normalize each KPI value to percentage-of-target before passing to the chart, or compute per-KPI domain ranges.
- [ ] `[EASY]` **Bug #2: Disabled nav has no tooltip** — When no assessment exists, nav links become `href="#"` with no user feedback. **Fix:** Add a tooltip ("Create an assessment first") or redirect to landing page with a toast message.
- [ ] `[EASY]` **Bug #3: Simulation results not auto-saved** — `runSimulation()` returns a scenario object but does not persist it. Users lose results if they adjust sliders without manually saving. **Fix:** Auto-save on run with undo support, or show a confirmation dialog before overwriting unsaved results.
- [ ] `[EASY]` **Bug #4: Landing form state lost on refresh** — Partial form input is lost on page reload. **Fix:** Persist form state to localStorage via a `useLocalStorage` hook or a small Zustand slice.
- [ ] `[EASY]` **Bug #5: No per-insight progress indicator in workshop** — Only a global counter exists. **Fix:** Add "2/3 answered" badge next to each insight in the left panel list.
- [ ] `[EASY]` **Bug #6: Export validation log truncated to 15 entries** — Earlier entries are silently dropped. **Fix:** Show all entries, or add a visible note ("Showing 15 of N entries") with an expand option.

---

## Phase 1: LLM Agent Integration

This is the highest-priority work. It replaces the static mock-data layer with real AI-generated assessments.

### Agent Architecture

- [ ] `[MEDIUM]` Create `src/agents/types.ts` — Define AgentMessage, AgentContext, and AgentResult interfaces that all agents share.
- [ ] `[HARD]` Create `src/agents/orchestrator.ts` — Coordinates all 6 specialized agents, manages shared context, sequences calls, merges outputs into a single Assessment. `[REQUIRES: agents/types.ts]`
- [ ] `[MEDIUM]` Create `src/services/api-client.ts` — LLM API wrapper (Claude or OpenAI) with retry logic, token management, and error handling.
- [ ] `[EASY]` Create `src/services/endpoints.ts` — API route definitions and constants.
- [ ] `[EASY]` Add API key configuration — `.env.local` setup with `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`.

### Specialized Agents

Each agent takes specific domain inputs and returns structured outputs that the orchestrator merges.

- [ ] `[HARD]` `src/agents/industry-agent.ts` — Input: ClientProfile. Output: value chain map, industry-specific topic weights, competitive positioning. This agent shapes the entire assessment structure.
- [ ] `[HARD]` `src/agents/financial-agent.ts` — Input: ClientFinancials + ClientProfile. Output: calibrated KPI baselines, peer comparison, financial health score. `[REQUIRES: agents/types.ts]`
- [ ] `[HARD]` `src/agents/product-agent.ts` — Input: ProductSKU[]. Output: portfolio complexity analysis, SKU rationalization opportunities, margin mix insights. `[REQUIRES: agents/types.ts]`
- [ ] `[HARD]` `src/agents/footprint-agent.ts` — Input: Segment[]. Output: footprint optimization opportunities, segment prioritization, market evolution assessment. `[REQUIRES: agents/types.ts]`
- [ ] `[HARD]` `src/agents/stakeholder-agent.ts` — Input: Stakeholder[]. Output: CXO profiles, change readiness map, stakeholder-tailored messaging per topic. `[REQUIRES: agents/types.ts]`
- [ ] `[HARD]` `src/agents/inventory-agent.ts` — Input: InventoryMetrics. Output: reduction targets, SLOB reduction plan, safety stock optimization with quantified impact. `[REQUIRES: agents/types.ts]`

### Integration

- [ ] `[HARD]` Wire orchestrator into `createAssessment()` — Replace mock-data hydration with agent call sequence. `[REQUIRES: orchestrator.ts, all 6 agents]`
- [ ] `[MEDIUM]` Build document/file ingestion UI on landing page — File upload for annual reports and PDFs that feed into agent context as DataSource. `[REQUIRES: api-client.ts]`
- [ ] `[HARD]` Dynamic insight generation — Agents generate insights contextually instead of returning the static 12. `[REQUIRES: orchestrator.ts]`
- [ ] `[HARD]` Dynamic question generation — Agents generate validation questions tailored to each generated insight. `[REQUIRES: dynamic insight generation]`
- [ ] `[HARD]` Dynamic heuristic calibration — Heuristic coefficients derived from industry data instead of static 16 rules. `[REQUIRES: industry-agent.ts]`

### Industry Templates

Static data files that provide domain defaults before agents are fully wired. Useful as agent grounding and fallbacks.

- [ ] `[MEDIUM]` `src/data/industry-templates/cpg.ts` — CPG-specific topic weights, benchmark ranges, heuristic coefficients.
- [ ] `[MEDIUM]` `src/data/industry-templates/pharma.ts` — Pharma-specific data.
- [ ] `[MEDIUM]` `src/data/industry-templates/industrial.ts` — Industrial Manufacturing-specific data.

---

## Phase 2: Backend & Multi-User Persistence

- [ ] `[MEDIUM]` Set up Next.js API routes (`src/app/api/`) — Foundation for all backend work.
- [ ] `[MEDIUM]` Database schema design — Assessment, ClientProfile, User, Organization tables.
- [ ] `[HARD]` Integrate PostgreSQL or Supabase — Replace localStorage with durable storage. `[REQUIRES: schema design]`
- [ ] `[HARD]` Replace Zustand localStorage with database-backed persistence — Keep Zustand for client-side cache but sync with DB. `[REQUIRES: database integration]`
- [ ] `[HARD]` Authentication system (NextAuth.js or Supabase Auth) — Consulting team login. `[REQUIRES: database integration]`
- [ ] `[HARD]` Role-based access control — Consulting Lead vs Client Stakeholder vs Read-only Viewer. `[REQUIRES: authentication]`
- [ ] `[MEDIUM]` Multi-assessment support — Consulting lead manages multiple client assessments from a single account. `[REQUIRES: authentication]`
- [ ] `[MEDIUM]` Assessment status workflow — Draft, in-progress, validated, complete with enforced transitions. `[REQUIRES: database integration]`
- [ ] `[MEDIUM]` Assessment history and version comparison — Track changes over time. `[REQUIRES: database integration]`
- [ ] `[HARD]` Multi-user concurrent workshop sessions — Multiple stakeholders answering questions simultaneously with conflict resolution. `[REQUIRES: database integration, authentication]`
- [ ] `[MEDIUM]` Audit trail for all confidence changes — Immutable log of who changed what and when. `[REQUIRES: database integration, authentication]`

---

## Phase 3: Advanced Analytics & UX

- [ ] `[MEDIUM]` Stakeholder-specific export views — Different report layouts: CTO (technology/OEE), CFO (financial impact/working capital), COO (operations/OTIF), SCM Lead (full detail).
- [ ] `[MEDIUM]` Side-by-side scenario comparison in simulation page — Compare 2+ saved scenarios visually.
- [ ] `[HARD]` Real-time peer benchmarking data integration — Pull from S&P, Gartner, or industry databases to replace static benchmarks. `[REQUIRES: API routes]`
- [ ] `[HARD]` Dynamic benefit heuristics from real datasets — Replace the static 16 rules with data-driven coefficients.
- [ ] `[EASY]` Workshop filtering — Filter insights by severity, category, or answered/unanswered status.
- [ ] `[MEDIUM]` Drag-and-drop opportunity prioritization — Reorder opportunities in the roadmap view.
- [ ] `[EASY]` Confidence threshold alerts — Flag insights that remain below a configurable confidence threshold after workshop.
- [ ] `[EASY]` Assessment completeness score — Show how much of the data model has been populated.
- [ ] `[MEDIUM]` Stakeholder assignment — Tag which stakeholder should answer which questions. Filter workshop view by assigned stakeholder.

---

## Phase 4: Enterprise & Scale

- [ ] `[HARD]` Multi-client portfolio dashboard — All active assessments with status, value at stake, and progress for consulting leads. `[REQUIRES: multi-assessment support, authentication]`
- [ ] `[HARD]` AI-generated narrative for each export section — LLM writes executive summary prose for each section of the export. `[REQUIRES: api-client.ts]`
- [ ] `[HARD]` Automated PowerPoint generation — Generate slide decks from assessment data. `[REQUIRES: export page]`
- [ ] `[HARD]` External data source integration — Bloomberg, S&P Capital IQ, Gartner APIs.
- [ ] `[MEDIUM]` White-labeling — Configurable branding (logo, colors, firm name) for consulting firms.
- [ ] `[MEDIUM]` Webhook/API for CRM integration — Push assessment status and results to Salesforce or similar.
- [ ] `[MEDIUM]` Assessment templates per engagement type — Pre-configured starting points for different consulting engagement types.

---

## Technical Debt

These are not features but architectural improvements that reduce long-term cost and risk.

- [ ] `[MEDIUM]` **Migrate UI primitives to shadcn/ui** — Current custom components in `src/components/ui/` shadow shadcn/ui patterns but lack accessibility features and maintenance. Evaluate migration cost vs benefit.
- [ ] `[MEDIUM]` **Extract business logic from Zustand store** — Confidence delta math and simulation engine currently live in `assessment-store.ts`. Move to `src/lib/simulation.ts` and `src/lib/confidence.ts` for testability.
- [ ] `[MEDIUM]` **Add unit tests** — Zero test coverage. Priority targets: simulation engine math (`runSimulation`), confidence delta logic (`answerQuestion`), and `maturityLabel`/`maturityColor` utilities.
- [ ] `[EASY]` **Split mock-data.ts** — The file is 640 lines. When agents are built, split into `topics.ts`, `insights.ts`, `questions.ts`, `kpis.ts`, `heuristics.ts`, `opportunities.ts`.
- [ ] `[EASY]` **Add .env.local template** — Create `.env.example` with placeholder keys for LLM APIs and future database credentials.

---

## Architecture Reference

```
src/
  app/                    # Next.js pages (landing, dashboard, workshop, simulation, export)
  components/             # Feature components (NavBar, MaturityHeatmap, KpiRadarChart, etc.)
  components/ui/          # UI primitives (Button, Card, Badge, Input, Select, Slider, Textarea)
  store/                  # Zustand store (assessment-store.ts)
  types/                  # Domain types (domain.ts)
  data/                   # Static data (mock-data.ts, future: industry-templates/)
  lib/                    # Utilities (utils.ts)
  agents/                 # [Phase 1] LLM agent modules
  services/               # [Phase 1] API client and endpoint definitions
```

### Key Data Flow

1. **Landing page** collects ClientProfile and calls `createAssessment()`.
2. **createAssessment()** hydrates a full Assessment object (currently from mock-data, future from LLM agents).
3. **Dashboard** reads the Assessment and renders summaries.
4. **Workshop** iterates through insights and questions; `answerQuestion()` updates confidence scores.
5. **Simulation** reads topic maturity scores and runs `runSimulation()` to project KPI impacts.
6. **Export** reads the full Assessment, validation log, and saved scenarios to render a printable report.
