# Value Chain Assessment & Simulation Platform

> Multi-agent AI system for supply chain maturity assessment, peer benchmarking,
> validation workshops, benefit simulation, and C-suite-ready roadmap generation.

## Overview

This platform helps consulting teams run **value chain discovery workshops** with clients. It:

1. Ingests client data (financials, footprint, products, org structure, inventory)
2. Runs **specialized AI agents** to analyze the business across multiple dimensions
3. Benchmarks against **industry peers**
4. Generates **insights, maturity assessments, roadmaps, and simulations**
5. Produces **C-suite-ready outputs** tailored per stakeholder (CTO, CFO, COO, SCM Lead)

### Who Uses It

| Persona | Role in the Tool |
|---------|-----------------|
| **Consulting Lead** | Configures assessment, runs workshop, reviews outputs |
| **Client Stakeholders** | Answer validation questions, review findings |
| **CXO / Board** | Consume simulation & roadmap outputs |

## Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
│  Landing → Dashboard → Workshop → Simulation → Export           │
├─────────────────────────────────────────────────────────────────┤
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
├────────┴────────────────┴──────────────┴───────────────────────┤
│                      DATA LAYER                                 │
│  Zustand (local) → localStorage → [Future: API + DB]           │
└─────────────────────────────────────────────────────────────────┘
```

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

### Quick Walkthrough

1. `/` — Enter client details → Generate Assessment
2. `/dashboard` — Review maturity, KPIs, insights, opportunities
3. `/workshop` — Drill into insights → answer questions → watch confidence update
4. `/simulation` — Adjust maturity sliders → see projected benefits → save scenarios
5. `/export` — Print the complete summary report

## Folder Structure

```
app/src/
├── app/                          # Pages (Next.js App Router)
│   ├── page.tsx                  # Landing / Create Assessment
│   ├── dashboard/page.tsx        # Assessment Dashboard
│   ├── workshop/page.tsx         # Validation Workshop
│   ├── simulation/page.tsx       # Benefit Simulation
│   └── export/page.tsx           # Export Summary
├── components/
│   ├── ui/                       # Button, Card, Badge, Input, Slider, etc.
│   ├── layout/nav-bar.tsx        # Navigation
│   ├── charts/                   # MaturityHeatmap, KpiRadarChart
│   └── workshop/                 # InsightDetail, QuestionForm
├── store/assessment-store.ts     # Zustand + persist + validation + simulation
├── types/domain.ts               # All TypeScript interfaces
├── data/mock-data.ts             # Mock insights, questions, KPIs, heuristics
└── lib/utils.ts                  # cn(), generateId(), formatters
```

### Future Folder Additions (agents build-out)

```
├── agents/                       # Multi-agent system
│   ├── orchestrator.ts           # Agent coordination + context sharing
│   ├── industry-agent.ts         # Industry & value chain mapping
│   ├── financial-agent.ts        # Financial & peer benchmarking
│   ├── product-agent.ts          # Product & SKU intelligence
│   ├── footprint-agent.ts        # Footprint & segment analysis
│   ├── stakeholder-agent.ts      # CXO profiling
│   ├── inventory-agent.ts        # Inventory performance analysis
│   └── types.ts                  # AgentMessage, AgentContext, AgentResult
├── data/
│   ├── industry-templates/       # Per-industry value chain definitions
│   │   ├── cpg.ts
│   │   ├── industrial.ts
│   │   └── pharma.ts
│   └── benchmarks/               # Industry benchmark data
└── services/                     # API service layer
    ├── api-client.ts
    └── endpoints.ts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| State | Zustand + localStorage persist |
| Forms | React Hook Form + Zod |
| Styling | TailwindCSS |
| UI | Custom shadcn/ui-style primitives |
| Charts | Recharts |
| Future: LLM | OpenAI / Azure OpenAI / Anthropic |
| Future: Backend | Next.js API routes |
| Future: DB | PostgreSQL / Supabase |
