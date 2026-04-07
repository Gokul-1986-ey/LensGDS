# LensGDS

**Value Chain Assessment & Simulation Platform**

LensGDS is a Next.js application that enables consulting teams to run structured supply chain maturity assessments with enterprise clients. It replaces static spreadsheets and slide decks with an interactive platform: AI-generated insights, live confidence scoring during stakeholder workshops, and a simulation engine that projects KPI improvements based on maturity investments.

The platform is designed around a real consulting workflow -- configure a client profile, review an AI-generated assessment, validate findings with stakeholders in a structured workshop, simulate improvement scenarios, and export a board-ready report.

---

## Why This Exists

Strategy and operations consultants spend weeks assembling supply chain diagnostics manually: benchmarking KPIs, interviewing stakeholders, building maturity models in Excel, and crafting PowerPoint narratives. LensGDS compresses that cycle by generating a structured assessment from client context, then refining it through a guided validation process that updates confidence scores in real time.

The key insight: most supply chain assessments follow predictable patterns. A $5B CPG company with 68% OEE and 85% OTIF has a recognizable profile. LensGDS encodes that pattern recognition (currently as heuristics, eventually as LLM agents) and lets consultants focus on what humans do best -- stakeholder dialogue, judgment, and prioritization.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js App Router)                │
│                                                                  │
│   Landing ──> Dashboard ──> Workshop ──> Simulation ──> Export   │
│     (/)       (/dashboard)  (/workshop)  (/simulation)  (/export)│
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     STATE LAYER (Zustand + localStorage)         │
│                                                                  │
│   assessment-store.ts                                            │
│   ├── createAssessment(profile) → hydrates from mock-data.ts     │
│   ├── answerQuestion(insightId, questionId, answer) → updates    │
│   │   confidence scores with delta logic                         │
│   ├── runSimulation(topicOverrides) → heuristic math engine      │
│   └── saveScenario / loadScenario / deleteScenario               │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                     DATA LAYER (currently static)                │
│                                                                  │
│   mock-data.ts → 13 topics, 12 insights, 30 questions,          │
│                  8 KPIs, 16 heuristics, 8 opportunities          │
│                                                                  │
│   [FUTURE] LLM Agent calls replace mock-data.ts                 │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow End-to-End

1. **Client Profile Entry** (`/`): Consultant fills in company name, industry, region, revenue band, and description. Form validated with React Hook Form + Zod. On submit, `createAssessment()` hydrates a full `Assessment` object from mock data.

2. **Dashboard** (`/dashboard`): Reads assessment from Zustand store. Renders the maturity heatmap (13 topics across 5 value chain categories), KPI radar chart (current vs target vs benchmark), top insights sorted by severity, and the 8 improvement opportunities with impact ranges.

3. **Workshop** (`/workshop`): Consultant selects an insight to validate. The system presents 2-3 structured questions per insight (30 total). Each answer triggers the confidence delta engine -- answers that confirm the insight increase confidence, contradictions decrease it, unknowns slightly decrease it. Topic-level confidence updates as the average of its related insights.

4. **Simulation** (`/simulation`): Consultant adjusts target maturity sliders for any of the 13 topics. The heuristic engine computes projected KPI improvements (low and high ranges) by chaining maturity deltas through benefit heuristics. Tradeoffs are auto-detected (e.g., aggressive inventory reduction vs OTIF risk). Scenarios can be saved, loaded, and compared.

5. **Export** (`/export`): Renders a print-ready summary combining client profile, maturity assessment, KPI projections, validated insights, and simulation results.

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js (App Router) + TypeScript | Server components where possible |
| State | Zustand + localStorage persist | Single store, no backend dependency yet |
| Forms | React Hook Form + Zod | Client profile validation |
| Styling | TailwindCSS | Utility-first, custom theme |
| UI | Custom shadcn/ui-style primitives | Button, Card, Badge, Input, Slider, Select, Textarea |
| Charts | Recharts | Radar chart, bar chart, heatmap |
| Future: LLM | OpenAI / Azure OpenAI / Anthropic Claude | Agent orchestration |
| Future: Backend | Next.js API routes + PostgreSQL | Multi-user persistence |

---

## Core Data Model

All types live in `src/types/domain.ts`. The central entity is `Assessment`, which aggregates everything:

- **ClientProfile** -- Company identity: name, industry (7 verticals), region, revenue band, description.
- **AssessmentTopic** (13 topics) -- Each represents a supply chain capability area (e.g., "Demand Planning & Forecasting"), categorized into plan/source/make/deliver/enable. Carries `currentMaturity` (1-5), `targetMaturity`, `confidence` (0-1), and `relatedKpis[]`.
- **Insight** (12 insights) -- AI-generated findings with severity (critical/high/medium/low), confidence score, supporting evidence, assumptions, financial impact estimate, and linked validation questions.
- **KPI** (8 metrics) -- Baseline, target, and benchmark values for metrics like Forecast Accuracy, OTIF, Inventory Turns, OEE, Cost to Serve, and CO2 Emissions.
- **ValidationQuestion** (30 questions) -- Structured prompts with typed answers (yes-no, select-one, numeric, slider, free-text) and impact mappings that drive confidence deltas.
- **BenefitHeuristic** (16 rules) -- Links between topic maturity improvements and KPI deltas (e.g., Demand Planning +1 maturity = Forecast Accuracy +3-6pts).
- **Opportunity** (8 initiatives) -- Improvement programs with effort level, timeline classification (quick-win/medium-term/strategic), and impact ranges. Total portfolio: $75-168M value at stake.

---

## Confidence Scoring System

The confidence model is the intellectual core of the workshop module. Every insight starts with a baseline confidence (typically 0.6-0.7). As stakeholders answer validation questions, confidence adjusts according to deterministic rules:

**Per-question logic** (in `answerQuestion` in the store):

| Answer type | Question category = confirming | Other categories |
|-------------|-------------------------------|------------------|
| Confirming answer (true/yes/positive) | +0.15 | +0.10 |
| Contradicting answer (false/no/negative) | -0.20 | -0.15 |
| Unknown / uncertain | -0.05 | -0.05 |

The asymmetry is intentional: contradictions should erode confidence faster than confirmations build it. A single "no" from a plant manager on OEE tracking can invalidate an assumption that took three confirmations to establish.

**Topic confidence** is the mean confidence of all insights related to that topic. This creates a natural flow: answering questions about a specific insight (e.g., "Demand forecast accuracy 13pts below benchmark") ripples upward to affect confidence in the parent topic ("Demand Planning & Forecasting") and downstream into simulation reliability.

---

## Simulation Engine

The simulation engine (`runSimulation` in the store) is live and functional. It uses a heuristic approach:

1. **Input**: `topicOverrides` -- a map of topic IDs to desired target maturity levels.
2. **For each KPI**: find all benefit heuristics that link to it.
3. **For each heuristic**: compute `maturityDelta = newTarget - currentMaturity` for the linked topic, then multiply by the heuristic's `perMaturityPointImprovement` (which has low and high bounds).
4. **Aggregate**: sum all heuristic contributions to produce `projectedLow` and `projectedHigh` for each KPI.
5. **Tradeoff detection**: flag cases where aggressive improvements in one area create risk in another (e.g., pushing inventory turns too high can threaten OTIF).

Example: Setting Demand Planning from maturity 2 to 4 (delta = 2) with a heuristic of +3-6pts Forecast Accuracy per maturity point yields a projected improvement of +6-12 percentage points on Forecast Accuracy.

The math is real -- only the input data (baselines, heuristic coefficients) is currently static.

---

## Planned Agent Architecture

The platform is designed for a multi-agent AI backend. All agent outputs are currently mocked in `src/data/mock-data.ts`. The architecture separates data gathering (6 specialized agents) from synthesis (4 engines):

```
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR AGENT                         │
│  Coordinates all agents, manages context, merges outputs        │
├────────┬────────┬────────┬────────┬────────┬───────────────────┤
│INDUSTRY│FINANCE │PRODUCT │FOOT-   │STAKE-  │ INVENTORY         │
│& VALUE │& PEER  │& SKU   │PRINT & │HOLDER  │ PERFORMANCE       │
│ CHAIN  │BENCH-  │INTEL   │SEGMENT │INTEL   │ AGENT             │
│ AGENT  │MARK    │AGENT   │AGENT   │AGENT   │                   │
│        │AGENT   │        │        │        │                   │
├────────┴────────┴────────┴────────┴────────┴───────────────────┤
│                      SYNTHESIS LAYER                            │
├────────┬────────────────┬──────────────┬───────────────────────┤
│INSIGHT │ ASSESSMENT +   │  ROADMAP     │ SIMULATION            │
│ENGINE  │ QUERY ENGINE   │  GENERATOR   │ ENGINE                │
└────────┴────────────────┴──────────────┴───────────────────────┘
```

**Specialized Agents:**

- **Industry & Value Chain Agent** -- Maps the client's industry structure, competitive dynamics, and structural risk factors. Outputs a value chain map and competitive positioning. This is the context-setting agent: everything else depends on understanding the client's industry.

- **Finance & Peer Benchmarking Agent** -- Ingests client financials (revenue, EBIT, ROIC, COGS breakdown, TSR) and benchmarks against industry peers. Outputs gap analysis and financial health scores that calibrate the severity of each insight.

- **Product & SKU Intel Agent** -- Analyzes portfolio complexity: total SKUs, revenue concentration, tail SKU percentage, margin by product family. Identifies SKU rationalization opportunities that directly impact inventory and manufacturing topics.

- **Footprint & Segment Agent** -- Analyzes geographic and manufacturing footprint alongside market segments (size, growth, share, margin). Outputs footprint optimization recommendations and segment prioritization.

- **Stakeholder Intel Agent** -- Profiles CXO-level stakeholders: background, mandate, change readiness, priorities, concerns. This agent powers stakeholder-tailored messaging and helps consultants navigate organizational politics during workshops.

- **Inventory Performance Agent** -- Deep analysis of inventory health: DOI, turns, SLOB percentage, stockout rate, carrying cost, age profiles. Outputs specific reduction targets and safety stock optimization recommendations.

The **Orchestrator** sequences agent calls, manages shared context, and resolves conflicts (e.g., if the Finance Agent flags low ROIC but the Industry Agent says it is structural for the sector).

---

## Current State vs Future Vision

| Capability | Current State | Future Vision |
|-----------|--------------|---------------|
| Assessment generation | Static mock data (13 topics, 12 insights) | LLM agents generate from client context + documents |
| KPI baselines | Hardcoded defaults | Derived from client financials + peer benchmarks |
| Validation questions | 30 static questions | Dynamically generated based on insight content |
| Confidence scoring | Live -- real delta math | Same math, agent-calibrated starting points |
| Simulation engine | Live -- heuristic math with static coefficients | Dynamic heuristics from industry datasets |
| Opportunities | 8 static initiatives | Agent-generated, client-specific roadmap |
| Data ingestion | None | Annual reports, PDFs, financial filings |
| Per-industry templates | Spec'd but empty (cpg.ts, pharma.ts, industrial.ts) | Full industry-specific topic weights and benchmarks |
| Persistence | localStorage only | PostgreSQL / Supabase, multi-user |
| Authentication | None | Consulting team login, role-based access |
| Export | Single report format | Stakeholder-specific views (CTO vs CFO vs COO) |
| Collaboration | Single user | Multi-user concurrent workshop sessions |

---

## Folder Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Landing / Create Assessment
│   ├── dashboard/page.tsx        # Assessment Dashboard
│   ├── workshop/page.tsx         # Validation Workshop
│   ├── simulation/page.tsx       # Benefit Simulation
│   └── export/page.tsx           # Export Summary
├── components/
│   ├── ui/                       # Button, Card, Badge, Input, Slider, Select, Textarea
│   ├── layout/nav-bar.tsx        # Navigation bar
│   ├── charts/
│   │   ├── maturity-heatmap.tsx  # Topic maturity grid (13 topics x 5 categories)
│   │   └── kpi-radar-chart.tsx   # KPI current/target/benchmark overlay
│   └── workshop/
│       ├── insight-detail.tsx    # Insight card with evidence, assumptions, financials
│       └── question-form.tsx     # Dynamic renderer for 5 answer types
├── store/assessment-store.ts     # Zustand store (all state + business logic)
├── types/domain.ts               # All TypeScript interfaces
├── data/mock-data.ts             # Static data (replace with agent calls in Phase 1)
└── lib/utils.ts                  # cn(), generateId(), formatters
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Walkthrough:**

1. **`/`** -- Enter client details (name, industry, region, revenue band, description). Click "Generate Assessment".
2. **`/dashboard`** -- Review the maturity heatmap across 13 supply chain topics, KPI radar chart comparing current vs target vs benchmark, top insights ranked by severity, and the 8 improvement opportunities with total value at stake ($75-168M).
3. **`/workshop`** -- Select an insight to validate. Answer 2-3 structured questions per insight. Watch confidence scores update in real time. The change log tracks every answer and its impact.
4. **`/simulation`** -- Drag maturity sliders per topic to model improvement scenarios. The bar chart updates with projected KPI improvements (low/high ranges). Tradeoffs surface automatically. Save scenarios for comparison.
5. **`/export`** -- Print the complete C-suite summary report.

---

## Development Notes

- **State is entirely client-side.** The Zustand store persists to localStorage. Refreshing the page retains the assessment. There is no backend -- this is intentional for the current phase.
- **Mock data is the seam.** When agents are built, the replacement point is `src/data/mock-data.ts`. The store's `createAssessment` function currently pulls from this file; it will eventually call the orchestrator agent instead.
- **The simulation math is production-ready.** The heuristic engine in `runSimulation` is not a placeholder -- it performs real calculations. Only the heuristic coefficients themselves are static.
- **Industry templates are stubbed.** Files for CPG, Pharma, and Industrial Manufacturing are spec'd but not yet populated. These will contain industry-specific topic weights, benchmark ranges, and default heuristic coefficients.
