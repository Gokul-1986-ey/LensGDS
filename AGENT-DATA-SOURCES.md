# AGENT-DATA-SOURCES.md — External Data Sources for LensGDS AI Agents

> **LensGDS** — Value Chain Assessment & Simulation Platform
> Last updated: 2026-04-07

This document catalogs every external data source that the 7 LensGDS AI agents (Orchestrator + 6 specialists) need to access in order to generate accurate, company-specific supply chain maturity assessments. It is written for developers building the agent integration layer.

Each entry specifies what data to pull, how to access it, what it costs, and where the gaps are. This is the bridge between "the agent needs peer financials" and "call this API endpoint with this authentication method and parse this response field."

---

## Data Architecture Philosophy

Agent data acquisition follows a layered strategy, with each layer adding cost but also accuracy:

1. **Layer 0 — Client-provided uploads**: Annual reports, internal KPI spreadsheets, org charts. Highest accuracy, lowest automation.
2. **Layer 1 — Free public sources**: SEC EDGAR, Companies House, USPTO, public news APIs. Automatable, zero marginal cost, but limited to public companies and US/UK/EU jurisdictions.
3. **Layer 2 — Freemium APIs**: Yahoo Finance, Alpha Vantage, Crunchbase Basic, OpenCorporates. Good for prototyping. Rate-limited and shallow.
4. **Layer 3 — Paid aggregators**: S&P Capital IQ, Refinitiv, FactSet, IBISWorld, ZoomInfo. The production-grade layer. Comprehensive, structured, and expensive.
5. **Layer 4 — Enterprise contracts**: Bloomberg Terminal, Gartner research, NielsenIQ, IQVIA. Require annual contracts and named-user licenses. Budget for these only after product-market fit.

The recommended build order: start with Layers 0-2 to prove the agent architecture works, then negotiate Layer 3 contracts as client volume justifies the spend. Layer 4 is a Phase 3+ concern.

---

## Master Summary Table

| # | Source | Category | Agents | Access Method | Cost Tier | Freshness |
|---|--------|----------|--------|---------------|-----------|-----------|
| 1 | SEC EDGAR | Public Filings | Finance, Industry, Inventory, Product | REST API (free) | Free | Quarterly |
| 2 | Companies House | Public Filings | Finance, Footprint | REST API (free) | Free | Annual |
| 3 | Company IR Websites | Public Filings | All 6 specialists | Web scraping / manual | Free | Quarterly |
| 4 | S&P Capital IQ | Financial Aggregator | Finance, Inventory, Industry | Paid API / Platform | $$$$ ($24K-50K/yr) | Daily |
| 5 | Refinitiv / LSEG | Financial Aggregator | Finance, Industry, ESG | Paid API | $$$$ ($20K-40K/yr) | Real-time |
| 6 | FactSet | Financial Aggregator | Finance, Inventory | Paid API | $$$$ ($20K-48K/yr) | Daily |
| 7 | Yahoo Finance API | Financial Aggregator | Finance | Free API / RapidAPI | Free-$50/mo | Delayed 15min |
| 8 | Alpha Vantage | Financial Aggregator | Finance | Free API (key required) | Free (5/min) | Daily |
| 9 | Macrotrends | Financial Aggregator | Finance, Inventory | Web scraping | Free | Quarterly |
| 10 | Gartner SC Top 25 | SC Benchmarks | Industry, Inventory | Manual / licensed PDF | $$$$ (Gartner sub) | Annual |
| 11 | APQC Benchmarks | SC Benchmarks | Industry, Inventory, Footprint | Licensed database | $$$ ($5K-15K/yr) | Annual |
| 12 | IBISWorld | Market & Industry | Industry, Product | Paid API | $$$ ($3K-10K/yr) | Quarterly |
| 13 | Statista | Market & Industry | Industry, Product, Footprint | Paid API | $$ ($1K-5K/yr) | Monthly |
| 14 | NielsenIQ / IRI | Market & Industry | Product | Enterprise contract | $$$$ ($50K+/yr) | Weekly |
| 15 | IQVIA | Market & Industry | Product (Pharma) | Enterprise contract | $$$$ ($50K+/yr) | Monthly |
| 16 | Panjiva / S&P Global Trade | Trade & Logistics | Industry, Footprint | Paid API | $$$ ($10K-25K/yr) | Daily |
| 17 | UN Comtrade | Trade & Logistics | Industry, Footprint | Free API | Free | Monthly |
| 18 | Freightos Baltic Index | Trade & Logistics | Footprint, Inventory | Free API | Free | Daily |
| 19 | Crunchbase | Company Intelligence | Stakeholder, Industry | Freemium API | $$ ($2K-5K/yr) | Daily |
| 20 | ZoomInfo | Company Intelligence | Stakeholder, Footprint | Paid API | $$$$ ($15K-30K/yr) | Daily |
| 21 | Dun & Bradstreet | Company Intelligence | Finance, Footprint, Industry | Paid API | $$$$ ($10K-25K/yr) | Monthly |
| 22 | OpenCorporates | Company Intelligence | Footprint, Industry | Freemium API | Free-$$ | Monthly |
| 23 | LinkedIn (profiles) | Stakeholder Intel | Stakeholder | Official API (restricted) | $$$ (partnership) | Real-time |
| 24 | BoardEx | Stakeholder Intel | Stakeholder | Paid platform | $$$$ ($15K+/yr) | Monthly |
| 25 | Seeking Alpha / Motley Fool | Earnings Transcripts | Finance, Stakeholder, Industry | Freemium / scraping | Free-$$ | Quarterly |
| 26 | NewsAPI.org | News & Events | All 6 specialists | REST API | Free-$450/mo | Real-time |
| 27 | Google News | News & Events | All 6 specialists | Scraping (no official API) | Free | Real-time |
| 28 | Supply Chain Dive | News & Events | Industry, Footprint, Inventory | RSS / scraping | Free | Daily |
| 29 | CDP | ESG & Sustainability | Industry, Footprint | Public reports / API | Free-$$ | Annual |
| 30 | MSCI ESG Ratings | ESG & Sustainability | Industry, Finance | Paid API | $$$$ ($20K+/yr) | Monthly |
| 31 | Sustainalytics | ESG & Sustainability | Industry, Finance | Paid API | $$$ ($10K+/yr) | Monthly |
| 32 | USPTO / Google Patents | Patent & Technology | Product, Industry | Free API | Free | Weekly |
| 33 | FDA / OSHA / EPA | Regulatory | Industry, Footprint | Free API / FOIA | Free | Varies |
| 34 | SimilarWeb | Alternative Data | Product, Industry | Paid API | $$$ ($5K-15K/yr) | Monthly |
| 35 | Satellite Imagery (Orbital Insight) | Alternative Data | Footprint, Inventory | Paid API | $$$$ ($25K+/yr) | Weekly |
| 36 | LinkedIn Jobs / Indeed | Talent Signals | Stakeholder, Industry | Scraping / API | Free-$$ | Daily |
| 37 | World Bank LPI | Trade & Logistics | Footprint | Free API | Free | Biennial |

---

## Category 1: Company Public Filings & Financial Data

### SEC EDGAR

**What it is**: The US Securities and Exchange Commission's public filing database. Every US public company files 10-K (annual), 10-Q (quarterly), 8-K (material events), DEF 14A (proxy/executive compensation), and S-1 (IPO) documents here.

**Which agents use it**: Finance & Peer Benchmarking (revenue, EBIT, COGS, working capital, inventory levels), Industry & Value Chain (segment disclosures, supplier concentration risks in 10-K Item 1A), Product & SKU Intel (revenue by segment/product line from 10-K footnotes), Inventory Performance (inventory balances, DIO calculations from balance sheet), Stakeholder Intel (executive compensation and tenure from DEF 14A proxy).

**Specific data points to extract**:
- Income statement: revenue, COGS, gross margin, operating income, EBIT
- Balance sheet: total inventory, accounts receivable, accounts payable, total assets
- Cash flow statement: CapEx, depreciation, free cash flow
- Segment reporting (ASC 280 disclosures): revenue and operating income by business unit
- Risk factor disclosures (Item 1A): supply chain risks, single-source suppliers, geographic concentration
- Executive officer table (DEF 14A): names, titles, tenure, compensation

**Access method**: EDGAR Full-Text Search API (`efts.sec.gov/LATEST/`) and XBRL API (`data.sec.gov/api/xbrl/`). No authentication required. Rate limit: 10 requests/second with a declared User-Agent header. XBRL structured data available for filings after 2009.

**Cost**: Free.

**Freshness**: 10-K filings appear within 60 days of fiscal year end. 10-Q filings within 40 days of quarter end. 8-K filings within 4 business days of material events.

**Limitations**: US public companies only. XBRL tag consistency varies across companies (custom extensions are common). PDF-only filings (pre-2009) require document parsing. Private companies do not file here. Non-US companies file 20-F annually (less granular than 10-K).

### Companies House (UK)

**What it is**: UK corporate registry with annual accounts, confirmation statements, and officer listings.

**Which agents use it**: Finance (abbreviated financial statements for UK entities), Footprint (registered office addresses, subsidiary structure), Stakeholder (director appointments and resignations).

**Access method**: REST API (`api.company-information.service.gov.uk`). Free API key required. Rate limit: 600 requests/5 minutes.

**Cost**: Free.

**Limitations**: Small and medium companies can file abbreviated accounts with limited financial detail. Large private companies file full accounts but with a 9-month lag. No segment-level revenue breakdowns.

### Company IR Websites (Annual Reports, Investor Presentations)

**What it is**: The Investor Relations section of a company's website, containing annual reports, quarterly earnings presentations, capital markets day slides, and sustainability reports as downloadable PDFs.

**Which agents use it**: All 6 specialists. Annual reports and investor presentations are the single richest source of company-specific supply chain information: manufacturing footprint maps, SKU count disclosures, logistics network descriptions, strategic priority statements, and leadership bios.

**Specific data points to extract**:
- Supply chain strategy commentary (often in CEO letter or operations review section)
- Manufacturing plant locations (often shown as a map graphic requiring OCR/vision)
- Distribution center count and locations
- SKU count or product line count (often disclosed in CPG/retail annual reports)
- Sustainability metrics: Scope 1/2/3 emissions, water usage, waste reduction targets
- Strategic priorities and investment plans

**Access method**: Manual download or targeted web scraping per company domain. No universal API exists. PDF parsing via LlamaIndex/Unstructured.io (see SOURCES.md items 17-18). For structured extraction from investor presentation slides, a vision-capable LLM (Claude with vision) can parse charts and infographics.

**Cost**: Free (content is public). Processing cost is LLM token spend for PDF parsing.

**Freshness**: Annual reports published 2-4 months after fiscal year end. Investor presentations published around earnings dates.

**Limitations**: Unstructured data requires significant parsing effort. Format varies wildly across companies. Some companies gate presentations behind email registration. Non-English reports require translation.

---

## Category 2: Financial Data Aggregators

### S&P Capital IQ

**What it is**: The institutional-grade financial data platform. Provides standardized financial statements, peer screening, segment-level financials, supply chain relationship mapping, and credit ratings for public and large private companies globally.

**Which agents use it**: Finance & Peer Benchmarking (primary source for standardized peer comparisons), Inventory Performance (standardized inventory metrics across peers), Industry & Value Chain (industry classification, competitive landscape screening).

**Specific data points to extract**:
- Standardized financial statements (income, balance sheet, cash flow) — 10+ years history
- Financial ratios: ROIC, ROE, EBIT margin, inventory turns, DIO, DPO, DSO, cash conversion cycle
- Peer group screening by SIC/NAICS code, revenue range, geography
- Segment-level revenue and operating income
- Supply chain relationship data (known customers and suppliers)
- Credit ratings (S&P, Moody's, Fitch)
- TSR (Total Shareholder Return) calculations
- Consensus analyst estimates

**Access method**: Capital IQ API (Xpressfeed) or Capital IQ Excel Plugin for analyst workflows. Programmatic access requires an enterprise API license. SDK available for Python and Excel.

**Cost**: $24,000-$50,000/year per seat depending on data modules. API access is an additional negotiation. This is the most expensive single data source but also the most comprehensive.

**Freshness**: Financial data updated within 24 hours of filing. Estimates updated daily.

**Limitations**: Private company coverage is limited to larger entities (>$50M revenue typically). API documentation is complex. Per-seat licensing limits the number of concurrent agent processes that can query. Requires legal review of terms for automated AI consumption.

### Yahoo Finance API / Alpha Vantage

**What it is**: Free or low-cost financial data APIs suitable for prototyping the Finance agent before committing to enterprise contracts.

**Which agents use it**: Finance & Peer Benchmarking (basic financials, stock price history, market cap).

**Specific data points to extract**:
- Stock price history (OHLCV), market cap, P/E ratio
- Basic income statement, balance sheet, cash flow (annual and quarterly)
- Earnings dates and basic estimates

**Access method**: Yahoo Finance via `yfinance` Python library or RapidAPI wrapper. Alpha Vantage via REST API with free API key.

**Cost**: Yahoo Finance: free (unofficial, may break). Alpha Vantage: free tier at 5 calls/min, premium at $50/month for 75 calls/min.

**Freshness**: Stock prices delayed 15 minutes on free tiers. Financial statements updated within days of filing.

**Limitations**: Data quality is inconsistent. No segment-level data. No private company coverage. No credit ratings. No supply chain relationship data. Yahoo Finance has no official API and wrappers break periodically. Not suitable for production use with paying clients, but adequate for development and demos.

---

## Category 3: Supply Chain & Industry Benchmarks

### Gartner Supply Chain Top 25

**What it is**: Annual ranking and benchmarking report scoring the world's leading supply chains on ROA, inventory turns, revenue growth, and a composite opinion score. The industry standard reference for supply chain maturity.

**Which agents use it**: Industry & Value Chain (industry-level maturity context), Inventory Performance (benchmark inventory turns and ROA by industry).

**Specific data points to extract**: Composite supply chain score by company, ROA ranking, inventory turns ranking, revenue growth weighting, peer group placement, "Masters" category qualifications.

**Access method**: Licensed PDF report. No API. Data must be manually extracted or parsed from the PDF and stored in a reference database that agents query. Update the reference database annually.

**Cost**: Requires a Gartner research subscription ($30,000-$100,000+/year depending on contract). Individual report purchase may be possible at $2,000-$5,000.

**Freshness**: Published annually (typically Q2).

**Limitations**: Covers only ~300 companies. Heavy weighting toward large public companies. Composite scoring methodology is Gartner's proprietary opinion, not purely quantitative. Cannot be redistributed to clients without licensing.

### APQC (American Productivity & Quality Center)

**What it is**: The largest database of process-level benchmarks across industries. Covers supply chain planning, procurement, manufacturing, logistics, and order management KPIs.

**Which agents use it**: Industry & Value Chain (process maturity benchmarks), Inventory Performance (inventory management process benchmarks), Footprint & Segment (logistics cost benchmarks by geography and industry).

**Specific data points to extract**: Perfect order rate by industry, forecast accuracy benchmarks, procurement cycle time, logistics cost as % of revenue, warehouse cost per unit shipped, plan-to-deliver cycle time.

**Access method**: Licensed database with web portal. No public API. Data must be extracted and loaded into a reference table.

**Cost**: $5,000-$15,000/year for benchmark access.

**Freshness**: Updated annually with survey data from member organizations.

**Limitations**: Benchmarks are aggregated medians/quartiles, not company-specific. Sample sizes vary by industry and metric. Participation bias toward companies that invest in benchmarking (likely more mature than average).

---

## Category 4: Market & Industry Data

### IBISWorld

**What it is**: Industry reports organized by NAICS/SIC code covering market size, growth rate, competitive landscape, supply chain structure, and key success factors for thousands of industries.

**Which agents use it**: Industry & Value Chain (industry structure, competitive dynamics, value chain maps), Product & SKU Intel (market size and growth by product category).

**Specific data points to extract**: Industry revenue and growth rate (5-year CAGR), market concentration (HHI, CR4), major player market share, supply chain structure description, key external drivers, industry life cycle stage.

**Access method**: API available on enterprise plans. Individual report PDFs on standard plans.

**Cost**: $3,000-$10,000/year depending on number of industries covered.

**Freshness**: Reports updated quarterly or when material changes occur.

**Limitations**: US-centric (IBISWorld has separate AU, UK, and global editions but coverage depth varies). Industry definitions may not perfectly map to a client's actual competitive set.

### NielsenIQ / IRI (Circana)

**What it is**: Point-of-sale retail data providing market share, volume, and pricing by product category, brand, and SKU at retail.

**Which agents use it**: Product & SKU Intel (market share by product category, SKU-level velocity data, competitive positioning).

**Specific data points to extract**: Dollar and unit market share by brand and category, price per unit trends, distribution (% ACV), new product launch tracking, promotional lift analysis.

**Access method**: Enterprise data feeds or platform access. No self-serve API.

**Cost**: $50,000+/year. Pricing is by category and geography coverage.

**Freshness**: Weekly POS data with 2-week lag.

**Limitations**: CPG/retail only. Does not cover B2B or industrial products. E-commerce coverage is improving but still partial. Requires category-specific licensing. The cost makes this viable only when LensGDS has enough CPG clients to justify the investment.

---

## Category 5: Stakeholder & Executive Intelligence

### LinkedIn (Official API / Sales Navigator)

**What it is**: The primary source for executive career histories, tenure, professional networks, and recent public statements.

**Which agents use it**: Stakeholder Intel (CXO profiles, career history, tenure at current company, previous employers, recent posts and articles, network connections to known supply chain leaders).

**Specific data points to extract**: Current title and company, start date (tenure calculation), previous roles (career trajectory), education, skills endorsements (domain expertise signals), recent posts (strategic priority signals), group memberships.

**Access method**: LinkedIn Marketing API provides limited company data. LinkedIn Sales Navigator provides individual profile data but restricts automated extraction. The official Voyager API is not publicly documented. Scraping is explicitly prohibited by LinkedIn ToS and enforced via rate limiting and legal action (hiQ Labs v. LinkedIn, though the legal landscape has shifted).

**Recommended approach**: Use LinkedIn Sales Navigator for manual pre-assessment research. For automated enrichment, use ZoomInfo or Clearbit as intermediaries — they have licensed LinkedIn data and provide it via compliant APIs.

**Cost**: Sales Navigator Team: $1,200-$1,800/user/year. API partnership programs: enterprise negotiation.

**Freshness**: Real-time (profiles update when individuals edit them).

**Limitations**: Automated scraping is a legal risk. API access is restricted and approval-based. Profile completeness varies. Senior executives often have sparse profiles. Must comply with GDPR for EU-based executives.

### BoardEx

**What it is**: Database of board directors and senior executives at public companies globally, including compensation, committee memberships, and network connections between boards.

**Which agents use it**: Stakeholder Intel (board composition, executive network analysis, identification of newly appointed leaders who may drive supply chain transformation).

**Specific data points to extract**: Board member names and tenures, committee assignments (audit, compensation, operations), interlocking directorates, executive appointment/departure history, compensation data.

**Access method**: Web platform and data feeds. API available on enterprise plans.

**Cost**: $15,000+/year.

**Freshness**: Updated monthly from public filings and press releases.

**Limitations**: Public companies only. Coverage stronger in US/UK, thinner in Asia-Pacific. Does not capture below-C-suite roles (VP Supply Chain, etc.).

### Earnings Call Transcripts (Seeking Alpha / Motley Fool / Direct)

**What it is**: Verbatim transcripts of quarterly earnings calls where CEOs and CFOs discuss strategic priorities, supply chain challenges, inventory levels, and operational performance.

**Which agents use it**: Finance (forward guidance, margin commentary), Stakeholder Intel (CEO/CFO tone and priorities), Industry (competitive commentary, market conditions), Inventory Performance (management commentary on inventory health).

**Specific data points to extract**: Mentions of "supply chain," "inventory," "logistics," "working capital," "efficiency," "transformation," "restructuring." Sentiment analysis on operational tone. Specific KPI callouts (e.g., "we reduced DIO by 3 days this quarter").

**Access method**: Seeking Alpha API (paid), Motley Fool (scraping), or purchase transcripts from S&P Capital IQ / Refinitiv as part of existing subscriptions. Many companies also post transcripts on their IR pages.

**Cost**: Seeking Alpha Premium: $240/year. Capital IQ includes transcripts in enterprise subscription. Free transcripts available on Motley Fool with scraping.

**Freshness**: Transcripts available within 24 hours of the earnings call.

---

## Category 6: News & Current Events

### NewsAPI.org / Google News / Industry Publications

**What it is**: Aggregated news coverage used to detect supply chain disruptions, leadership changes, M&A activity, regulatory actions, and strategic announcements that materially affect the assessment.

**Which agents use it**: All 6 specialists. News is the real-time signal layer that updates the assessment context between formal data refreshes.

**Specific data points to extract**: CEO/CFO appointments or departures, M&A announcements, plant closures or openings, supply chain disruption events, regulatory actions, earnings surprises, analyst upgrades/downgrades.

**Access method**: NewsAPI.org REST API (free tier: 100 requests/day, paid: up to $450/month). Google News has no official API; use RSS feeds or SerpAPI as a proxy. Supply Chain Dive, FreightWaves, and Logistics Management provide industry-specific RSS feeds.

**Cost**: NewsAPI free tier sufficient for development. Production: $50-$450/month. SerpAPI for Google News: $50-$250/month. Industry RSS feeds: free.

**Freshness**: Real-time to hourly.

**Limitations**: NewsAPI free tier is development-only (no production use). Google News scraping is fragile. Paywalled content (FT, WSJ, Bloomberg) requires separate subscriptions for full-text access. Noise-to-signal ratio is high; agents need filtering logic to extract supply-chain-relevant news from general business coverage.

---

## Category 7: ESG & Sustainability Data

### CDP (Carbon Disclosure Project)

**What it is**: The largest database of company-reported environmental data, covering Scope 1/2/3 GHG emissions, water security, deforestation risk, and climate strategy.

**Which agents use it**: Industry & Value Chain (industry-level emissions benchmarks, supply chain environmental risk), Footprint & Segment (facility-level emissions where disclosed).

**Access method**: CDP data is available via their public scores page (free) and detailed response data via paid API or data license.

**Cost**: Public scores: free. Full response data: $5,000-$20,000/year.

**Freshness**: Annual (companies report once per year, scores published Q4).

### MSCI ESG Ratings / Sustainalytics

**What it is**: Third-party ESG risk ratings that aggregate environmental, social, and governance performance into a single score.

**Which agents use it**: Finance (ESG-adjusted risk profile), Industry (industry ESG benchmarks).

**Access method**: Paid API (MSCI ESG Manager, Sustainalytics ESG Risk Ratings platform).

**Cost**: $10,000-$30,000/year depending on universe coverage.

---

## Category 8: Trade & Logistics Data

### Panjiva / S&P Global Market Intelligence (Trade)

**What it is**: Import/export bill-of-lading data showing what companies are shipping, from where, to where, and in what volume. Reveals actual supplier relationships and logistics patterns.

**Which agents use it**: Industry & Value Chain (supplier ecosystem mapping, trade flow analysis), Footprint & Segment (port utilization, origin-destination patterns, logistics network inference).

**Specific data points to extract**: Supplier names by HS code, shipment volumes, origin/destination ports, shipping frequency, carrier usage, container counts.

**Access method**: Panjiva API or platform. S&P Global Market Intelligence trade module.

**Cost**: $10,000-$25,000/year.

**Freshness**: US Customs data available within 5-7 days of vessel arrival. Other countries vary (30-90 day lag common).

**Limitations**: US data is most comprehensive (mandatory public disclosure of import records). EU and many Asian countries do not require public disclosure of trade records. Export data is less complete than import data globally.

---

## Category 9: Alternative & Emerging Data

### Job Postings as Strategic Signals

**What it is**: Tracking a company's hiring patterns to infer supply chain investment priorities. Example: a company posting 15 "supply chain data scientist" roles signals a digital transformation initiative. A burst of "warehouse operations manager" roles signals DC expansion.

**Which agents use it**: Stakeholder Intel (organizational direction), Industry & Value Chain (industry-wide talent trends).

**Access method**: Indeed/Glassdoor scraping (fragile, ToS restricted). LinkedIn Jobs API (restricted). Lightcast / Burning Glass (licensed labor market analytics, $10K-$30K/year).

**Cost**: Free via scraping (risky). $10,000-$30,000/year via Lightcast for production-grade data.

### Patent Filings

**What it is**: USPTO and EPO patent filings that reveal a company's technology investment direction.

**Which agents use it**: Product & SKU Intel (product innovation pipeline), Industry & Value Chain (technology disruption signals).

**Access method**: USPTO Open Data API (free), Google Patents (free, searchable), PatSnap (paid analytics platform, $15K+/year).

**Cost**: Free for raw filings. Paid for analytics and trend detection.

### Regulatory Records (FDA, OSHA, EPA)

**What it is**: Government enforcement databases that reveal manufacturing quality issues, safety incidents, and environmental violations.

**Which agents use it**: Industry & Value Chain (regulatory risk), Footprint & Segment (facility-level compliance risk).

**Access method**: FDA openFDA API (free), OSHA inspection database (free, downloadable CSV), EPA ECHO database (free API).

**Cost**: Free.

**Limitations**: US-only. Data is retrospective (incidents that already happened). European equivalents (EMA, EU-OSHA) have different access patterns.

---

## Data Reliability & Confidence Scoring

Every data point ingested by an agent carries a **source reliability score** that feeds into the insight confidence calculation displayed in the assessment UI. The scoring framework:

| Reliability Tier | Score | Source Types | Example |
|-----------------|-------|-------------|---------|
| **Tier 1 — Audited** | 0.95 | Audited financial statements, regulatory filings | SEC 10-K, Companies House annual accounts |
| **Tier 2 — Structured Aggregator** | 0.85 | Standardized data from licensed aggregators | S&P Capital IQ financials, Refinitiv estimates |
| **Tier 3 — Company-Published** | 0.75 | Company-published but unaudited content | Investor presentations, sustainability reports, press releases |
| **Tier 4 — Third-Party Analysis** | 0.65 | Third-party reports and ratings | Gartner Top 25, MSCI ESG, IBISWorld reports |
| **Tier 5 — News & Commentary** | 0.50 | News articles, analyst commentary, interviews | NewsAPI results, earnings call sentiment |
| **Tier 6 — Inferred / Alternative** | 0.35 | Derived data, scraping, satellite, job postings | SimilarWeb traffic, LinkedIn job post counts |
| **Tier 7 — Agent Estimation** | 0.20 | LLM-generated estimates with no external backing | Agent fills gaps using training data patterns |

When an agent generates an insight, it must tag each supporting data point with its source and tier. The overall insight confidence is a weighted average of its supporting data tiers, multiplied by a recency factor (data older than 12 months decays by 0.05 per additional quarter).

**Rule**: No insight should appear in the client export with a confidence score below 0.40 without a human validation flag from the workshop.

---

## Data Pipeline Architecture

Raw source data flows through four stages before reaching an agent's context window:

```
[External Source] --> [Ingestion Layer] --> [Normalization] --> [Context Assembly] --> [Agent Prompt]
```

**Stage 1 — Ingestion**: API calls, PDF parsing, RSS polling, and web scraping run as background jobs triggered by assessment creation. Each job writes raw responses to a `source_documents` table in PostgreSQL (via Prisma) with metadata: source name, retrieval timestamp, company identifier, document type, and raw content hash for deduplication.

**Stage 2 — Normalization**: Raw data is transformed into structured objects matching the LensGDS domain types (see `src/types/domain.ts`). Financial data is standardized to USD using ECB exchange rates. Fiscal year periods are aligned to calendar quarters for peer comparison. Text content is chunked for LLM context windows (target: 2,000-token chunks with 200-token overlap).

**Stage 3 — Context Assembly**: The Orchestrator agent receives the assessment scope (company name, industry, revenue band) and assembles a context package for each specialist agent. Each package contains: (a) structured data tables relevant to that agent's domain, (b) text chunks ranked by relevance using embedding similarity, (c) source reliability metadata. Context packages are capped at 80,000 tokens per agent call to stay within Claude's context window with room for instructions and output.

**Stage 4 — Agent Prompt**: The specialist agent receives its context package, system prompt (defining its role, output schema, and confidence scoring rules), and the specific assessment questions it must answer. It generates structured JSON output conforming to the assessment domain types.

**Caching**: Ingested data is cached per company with a TTL matching the source's update frequency (e.g., SEC filings cached for 90 days, news cached for 24 hours, stock prices cached for 1 hour). A manual "refresh" button in the UI triggers a full re-ingestion for a specific assessment.

---

## Privacy & Compliance Considerations

### GDPR (EU General Data Protection Regulation)

- **Executive profile data** (names, career histories, compensation) constitutes personal data under GDPR when the subject is an EU resident.
- **Lawful basis**: Legitimate interest (Article 6(1)(f)) for processing publicly available professional information in a B2B consulting context. Document this in a Data Protection Impact Assessment.
- **Right to erasure**: If an executive requests deletion, their profile data must be removable from the LensGDS database without breaking the assessment. Design the schema so stakeholder profiles are soft-deletable.
- **Data minimization**: Store only data points that directly serve the assessment. Do not bulk-harvest LinkedIn profiles beyond the target company's leadership team.

### LinkedIn Terms of Service

- Automated scraping of LinkedIn profiles is prohibited under their User Agreement and has been enforced via litigation.
- Use only official LinkedIn APIs or licensed intermediaries (ZoomInfo, Clearbit, People Data Labs) that have data-sharing agreements with LinkedIn.
- Sales Navigator is licensed for individual use by sales professionals, not for bulk automated extraction. Do not build scrapers against Sales Navigator.

### Data Residency

- Financial data from S&P Capital IQ, Refinitiv, and Bloomberg may have contractual restrictions on where it can be stored and processed.
- If LensGDS is deployed on Vercel (US-hosted by default), ensure that EU client data flows comply with the EU-US Data Privacy Framework or use Vercel's EU region deployment option.
- Some enterprise data providers require that API calls originate from specific regions or that data is not transmitted to third-party LLM providers. Review each contract's AI/ML usage clauses before sending licensed data to the Claude API.

### SEC Fair Disclosure (Reg FD)

- LensGDS must never incorporate material non-public information (MNPI) into an assessment. All data sources must be public or properly licensed.
- If a client stakeholder discloses unreleased financial results during a workshop session, flag this in the UI and exclude it from the AI-generated assessment until the information becomes public.

---

## Recommended Starting Stack

The minimum viable set of data sources to get the 6 agents producing useful output, before committing to enterprise contracts:

### Tier 1 — Build First (Free, Week 1-2)

| Source | Agents Served | What You Get |
|--------|--------------|--------------|
| SEC EDGAR XBRL API | Finance, Inventory, Product | Standardized US public company financials, segment data |
| Companies House API | Finance, Footprint | UK company financials and officer data |
| Yahoo Finance (`yfinance`) | Finance | Stock prices, basic financials, market cap for peer screening |
| Alpha Vantage | Finance | Backup financial data source |
| NewsAPI.org (free tier) | All | Real-time news context for any company |
| OpenCorporates (free tier) | Footprint | Global company registry for subsidiary mapping |
| USPTO Open Data | Product | Patent filing search |
| FDA openFDA API | Industry | Pharma/food regulatory record lookup |
| UN Comtrade | Industry, Footprint | International trade flows by HS code |
| Freightos Baltic Index | Footprint | Freight rate benchmarks |
| CDP public scores | Industry | ESG scores for major companies |

**Total cost**: $0. This layer gives the Finance agent real financial statements, the Industry agent basic news and trade context, and the Stakeholder agent nothing (the hardest agent to source cheaply).

### Tier 2 — Add Next (Low Cost, Month 1-2)

| Source | Agents Served | What You Get | Cost |
|--------|--------------|--------------|------|
| Crunchbase Basic API | Stakeholder, Industry | Company profiles, leadership names, funding history | ~$2,400/year |
| Seeking Alpha Premium | Finance, Stakeholder | Earnings call transcripts, analyst commentary | ~$240/year |
| Statista | Industry, Product | Market size data, industry statistics | ~$1,200/year |
| NewsAPI.org (paid) | All | Production-grade news API with higher rate limits | ~$600/year |

**Total cost**: ~$4,500/year. This layer gives the Stakeholder agent basic executive data and gives the Industry and Product agents market context.

### Tier 3 — Scale Investment (Enterprise, Month 3-6)

| Source | Agents Served | What You Get | Cost |
|--------|--------------|--------------|------|
| S&P Capital IQ | Finance, Inventory, Industry | Production-grade standardized financials and peer screening | ~$30,000/year |
| IBISWorld | Industry, Product | Structured industry reports by NAICS code | ~$5,000/year |
| ZoomInfo | Stakeholder, Footprint | Executive profiles, org charts, contact data | ~$15,000/year |
| APQC Benchmarks | Inventory, Industry | Process-level supply chain benchmarks | ~$10,000/year |
| Panjiva | Industry, Footprint | Trade data and supplier relationship mapping | ~$15,000/year |

**Total cost**: ~$75,000/year. This is the layer where assessments become defensible in a client boardroom with real peer benchmarks and sourced executive intelligence.

### Tier 4 — Enterprise Scale (Month 6+, justified by revenue)

Add NielsenIQ (CPG clients), IQVIA (pharma clients), Bloomberg (financial services clients), Gartner research subscription, BoardEx, MSCI ESG, and satellite/alternative data sources as client portfolio and revenue justify the spend.

---

*This document should be updated as data source contracts are signed, APIs are integrated, or access methods change. Every new data integration must have a corresponding entry here before the pull request is merged.*
