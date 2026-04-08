import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateAuditReportHtml } from '@/lib/report-generator';
import type { AuditReport } from '@/types/audit';

export const runtime = 'nodejs';
export const maxDuration = 120;

// ─── SSE helpers ─────────────────────────────────────────────

const enc = new TextEncoder();

function sseEvent(type: string, payload: Record<string, unknown>): Uint8Array {
  return enc.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
}

// ─── POST /api/audit ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { targetUrl, industry } = body as { targetUrl?: string; industry?: string };

  if (!targetUrl || !industry) {
    return new Response(
      JSON.stringify({ error: 'targetUrl and industry are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured in .env.local' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let hostname = '';
  let displayName = '';
  try {
    hostname = new URL(targetUrl).hostname.replace('www.', '');
    const slug = hostname.split('.')[0];
    displayName = slug.charAt(0).toUpperCase() + slug.slice(1);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid URL' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      const push = (type: string, payload: Record<string, unknown>) =>
        controller.enqueue(sseEvent(type, payload));

      try {
        push('progress', { message: `🔍 Initialising audit for ${displayName} (${hostname})...` });
        push('progress', { message: `🌐 Gathering company intelligence & SC profile...` });

        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        // ── Build the Claude prompt ──────────────────────────
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(displayName, hostname, industry);

        push('progress', { message: `🤖 Claude is analysing ${displayName}'s supply chain...` });

        // ── Call Claude (streaming to keep connection alive) ──
        let rawJson = '';

        const claudeStream = client.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 16000,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        });

        // Stream Claude tokens — emit heartbeat progress every ~500 chars
        let charCount = 0;
        const progressMilestones: [number, string][] = [
          [600,  '🏭 Mapping value chain (Plan → Source → Make → Deliver → Return)...'],
          [1800, '📊 Benchmarking competitors on financials & working capital...'],
          [3200, '💡 Generating gap analysis...'],
          [5000, '🎯 Writing strategic recommendations...'],
          [6500, '📄 Finalising report structure...'],
        ];
        let nextMilestone = 0;

        for await (const chunk of claudeStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            rawJson += chunk.delta.text;
            charCount += chunk.delta.text.length;

            if (
              nextMilestone < progressMilestones.length &&
              charCount >= progressMilestones[nextMilestone][0]
            ) {
              push('progress', { message: progressMilestones[nextMilestone][1] });
              nextMilestone++;
            }
          }
        }

        push('progress', { message: '🔧 Parsing structured audit data...' });

        // ── Parse JSON from Claude's response ────────────────
        const report = parseClaudeResponse(rawJson, displayName, hostname, industry);

        push('progress', { message: '🎨 Rendering HTML report with charts...' });

        const html = generateAuditReportHtml(report);

        push('complete', { report, html });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Audit generation failed';
        push('error', { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ─── Prompt builders ─────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are a world-class supply chain strategy consultant and competitive intelligence analyst. Your job is to generate a comprehensive, data-driven supply chain competitive audit report in JSON format.

CRITICAL RULES:
1. Respond ONLY with valid JSON — no markdown, no code fences, no preamble, no explanation.
2. Use real, specific data based on your knowledge of the company and industry. Do NOT use placeholder values like "TBD", "N/A", or 0 for financial figures unless the company is genuinely private and data is unavailable.
3. If exact figures are unknown, use well-researched estimates clearly noted (e.g., "~$2.3B est.").
4. Financial data should be realistic and internally consistent (COGS < Revenue, etc.).
5. Competitors must be real, named companies that actually compete in the same space.
6. All supply chain insights must be specific, actionable, and professional — McKinsey/BCG quality.
7. The report audience is CSCO, COO, and CXO — use executive-level language.`;
}

function buildUserPrompt(companyName: string, website: string, industry: string): string {
  return `Generate a complete supply chain competitive audit for:
- Company: ${companyName} (${website})
- Industry: ${industry}
- Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

Return a single JSON object matching EXACTLY this TypeScript structure (all fields required unless marked optional with ?):

{
  "targetCompany": {
    "name": string,
    "founded": string,          // e.g. "1969"
    "hq": string,               // e.g. "New York, NY"
    "ceo": string,
    "ticker": string,           // e.g. "NYSE: PEP" or "Private"
    "employees": string,        // e.g. "290,000+"
    "facilities": string,       // e.g. "300+ plants in 60 countries"
    "scProfessionals": string,  // e.g. "5,000+"
    "supplierNetwork": string,  // e.g. "30,000+ suppliers"
    "purchasingSpend": string,  // e.g. "$28B annually"
    "businessModel": string,    // e.g. "B2B / B2C Consumer Goods"
    "website": string
  },

  "industry": string,
  "reportDate": string,         // today's date as "Month DD, YYYY"

  "competitors": [              // EXACTLY 3 real named competitors
    {
      "name": string,           // Full company name
      "shortName": string,      // lowercase slug, e.g. "unilever"
      "tagline": string,        // one-line competitive positioning
      "website": string,        // e.g. "unilever.com"
      "colorFrom": string,      // hex color for card gradient start
      "colorTo": string,        // hex color for card gradient end
      "financials": [           // 2-3 years of data
        {
          "label": string,      // e.g. "FY2024"
          "revenue": number,    // in billions (e.g. 60.1)
          "cogs": number,       // in billions
          "grossMarginPct": number,    // percentage e.g. 8.5
          "yoyGrowthPct": number,      // e.g. -3.2 or 7.4
          "ebit": number,              // in billions
          "ebitMarginPct": number      // percentage
        }
      ],
      "workingCapital": {
        "dso": number,          // days
        "dio": number,          // days
        "dpo": number,          // days
        "c2c": number,          // cash-to-cash = dso + dio - dpo
        "inventoryTurns": number
      },
      "scMaturity": {           // scores 1-10
        "demandPlanning": number,
        "inventoryOptimization": number,
        "supplierCollaboration": number,
        "mfgFlexibility": number,
        "logisticsNetwork": number,
        "digitalScAi": number,
        "resilienceRisk": number
      },
      "namedScServices": number,   // count of distinct SC services offered
      "kpiHighlights": [           // exactly 4 items
        { "label": string, "value": string, "sub": string }
      ],
      "strengths": [               // 3-5 items
        { "text": string, "badge": string }   // badge: e.g. "Best-in-class"
      ],
      "weaknesses": [              // 3-5 items
        { "text": string, "badge": string }
      ],
      "differentiators": [string]  // 3-5 items
    }
  ],

  "execKpis": [                    // exactly 4 items
    {
      "label": string,
      "value": string,             // e.g. "~67 days" or "$2.1B"
      "sublabel": string,          // context/benchmark
      "color": "accent" | "warn" | "success" | "danger"
    }
  ],

  "strategicNarrative": string,    // 3-4 sentence executive summary paragraph (HTML allowed, use <strong> for emphasis)

  "riskOpportunities": {
    "risks": [string],             // exactly 5 risks
    "opportunities": [string]      // exactly 5 opportunities
  },

  "scServices": [                  // 8-12 SC service capabilities
    { "text": string, "color": "green" | "warn" | "blue" }
  ],

  "industriesServed": [string],    // 5-8 industry verticals

  "strategyStats": [               // 5-7 key strategic facts
    { "label": string, "value": string }
  ],

  "valueChain": [                  // exactly 5 steps
    {
      "phase": "plan" | "source" | "make" | "deliver" | "return",
      "name": string,
      "status": "strong" | "developing" | "gap",
      "bullets": [string]          // exactly 3 bullets
    }
  ],

  "industryOverview": {
    "stats": [                     // 5-6 industry stats
      { "label": string, "value": string }
    ],
    "trends": [                    // 6-8 industry trends
      { "text": string, "color": "red" | "warn" | "green" | "blue" }
    ]
  },

  "financials": [                  // 3 years of target company financials
    {
      "label": string,
      "revenue": number,
      "cogs": number,
      "grossMarginPct": number,
      "yoyGrowthPct": number,
      "ebit": number,
      "ebitMarginPct": number
    }
  ],

  "workingCapital": {              // target company working capital
    "dso": number,
    "dio": number,
    "dpo": number,
    "c2c": number,
    "inventoryTurns": number
  },

  "comparisonTable": [             // 8-10 comparison rows
    {
      "label": string,
      "values": [                  // 4 values: target + 3 competitors
        { "text": string, "status": "check" | "cross" | "partial" }
      ]
    }
  ],

  "gaps": [                        // 4-6 gaps
    {
      "priority": "high" | "medium" | "low",
      "category": string,
      "title": string,
      "description": string,
      "impact": string,
      "betterAtThis": [string]     // competitor names that do this better
    }
  ],

  "recommendations": [            // exactly 7 recommendations
    {
      "number": number,
      "title": string,
      "description": string,
      "horizon": "quick-win" | "mid-term" | "strategic",
      "impact": "high" | "medium",
      "effort": "low" | "medium" | "high",
      "wcImpact": string,          // working capital impact (optional, omit if not relevant)
      "timeline": string           // e.g. "2-4 weeks" or "3-6 months"
    }
  ],

  "quickWins": [                   // exactly 6 quick wins
    {
      "number": string,            // "01", "02", etc.
      "title": string,
      "description": string,
      "days": string,              // e.g. "1 week" or "2 weeks"
      "impactEstimate": string     // e.g. "$50-100M working capital release"
    }
  ]
}

Generate realistic, specific, research-grade data for ${companyName} in the ${industry} sector. Use your knowledge to provide real financial estimates, real competitor names, and genuine supply chain insights. The output must be production-quality — this will be shown directly to C-suite executives.`;
}

// ─── Response parser ─────────────────────────────────────────

function parseClaudeResponse(
  raw: string,
  companyName: string,
  hostname: string,
  industry: string
): AuditReport {
  // Strip any markdown fences Claude might have added despite instructions
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Find the JSON object boundaries
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Claude did not return valid JSON. Try again.');
  }
  cleaned = cleaned.slice(start, end + 1);

  let parsed: Partial<AuditReport>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse Claude response as JSON (received ${cleaned.length} chars). The response may have been truncated — try again.`);
  }

  // Ensure required top-level fields have fallbacks
  const report = parsed as AuditReport;

  if (!report.targetCompany) {
    report.targetCompany = { name: companyName, website: hostname, businessModel: industry };
  }
  if (!report.industry) report.industry = industry;
  if (!report.reportDate) {
    report.reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  }
  if (!Array.isArray(report.competitors)) report.competitors = [];
  if (!Array.isArray(report.execKpis)) report.execKpis = [];
  if (!report.strategicNarrative) report.strategicNarrative = '';
  if (!report.riskOpportunities) report.riskOpportunities = { risks: [], opportunities: [] };
  if (!Array.isArray(report.scServices)) report.scServices = [];
  if (!Array.isArray(report.industriesServed)) report.industriesServed = [];
  if (!Array.isArray(report.strategyStats)) report.strategyStats = [];
  if (!Array.isArray(report.valueChain)) report.valueChain = [];
  if (!report.industryOverview) report.industryOverview = { stats: [], trends: [] };
  if (!Array.isArray(report.financials)) report.financials = [];
  if (!report.workingCapital) report.workingCapital = { dso: 0, dio: 0, dpo: 0, c2c: 0, inventoryTurns: 0 };
  if (!Array.isArray(report.comparisonTable)) report.comparisonTable = [];
  if (!Array.isArray(report.gaps)) report.gaps = [];
  if (!Array.isArray(report.recommendations)) report.recommendations = [];
  if (!Array.isArray(report.quickWins)) report.quickWins = [];

  return report;
}
