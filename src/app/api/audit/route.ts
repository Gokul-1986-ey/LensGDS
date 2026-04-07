import { NextRequest, NextResponse } from 'next/server';
import { generateAuditReportHtml } from '@/lib/report-generator';
import type { AuditReport } from '@/types/audit';

/**
 * POST /api/audit
 * Accepts { targetUrl, industry } and returns the full audit report + HTML.
 *
 * Current implementation: generates a structured report using the data framework.
 * Future: integrates Playwright for live scraping and SerpAPI for competitor discovery.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetUrl, industry } = body;

    if (!targetUrl || !industry) {
      return NextResponse.json({ error: 'targetUrl and industry are required' }, { status: 400 });
    }

    // Extract company name from URL
    const hostname = new URL(targetUrl).hostname.replace('www.', '');
    const companyName = hostname.split('.')[0];
    const displayName = companyName.charAt(0).toUpperCase() + companyName.slice(1);

    // Build the audit report
    // In production, this would use Playwright + SerpAPI to gather real data.
    // For now, we build a structured report that the template engine can render.
    const report = await buildAuditReport(displayName, hostname, industry);

    // Generate HTML
    const html = generateAuditReportHtml(report);

    return NextResponse.json({ report, html });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Builds an AuditReport structure.
 * This is the integration point where Playwright scraping and SerpAPI
 * competitor discovery will plug in.
 */
async function buildAuditReport(
  companyName: string,
  hostname: string,
  industry: string
): Promise<AuditReport> {
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Placeholder competitor data — in production, SerpAPI finds these
  // and Playwright scrapes their websites
  const report: AuditReport = {
    targetCompany: {
      name: companyName,
      website: hostname,
      businessModel: `${industry} provider`,
    },
    industry,
    reportDate,
    competitors: [
      createPlaceholderCompetitor('Competitor A', 'comp-a', industry, '#003087', '#0066cc'),
      createPlaceholderCompetitor('Competitor B', 'comp-b', industry, '#cc0000', '#ff4444'),
      createPlaceholderCompetitor('Competitor C', 'comp-c', industry, '#1a6b3c', '#2ecc71'),
    ],
    execKpis: [
      { label: 'Cash-to-Cash Cycle', value: 'TBD', sublabel: 'Pending live data collection', color: 'accent' },
      { label: 'Inventory Turns', value: 'TBD', sublabel: 'Pending analysis', color: 'warn' },
      { label: 'Gross Margin Trend', value: 'TBD', sublabel: 'Pending financial data', color: 'success' },
      { label: 'Key Gap Identified', value: 'TBD', sublabel: 'Pending competitor analysis', color: 'danger' },
    ],
    strategicNarrative: `This audit analyzes <strong>${companyName}</strong> (${hostname}) operating in the <strong>${industry}</strong> sector. The analysis covers supply chain capabilities, financial benchmarking, competitive positioning, and strategic recommendations. Full data collection via Playwright website analysis and SerpAPI competitor discovery will populate all sections with live intelligence.`,
    riskOpportunities: {
      risks: [
        'Supply chain efficiency metrics need benchmarking against industry peers',
        'Working capital optimization opportunities to be quantified',
        'Digital supply chain capability gaps to be assessed',
        'Competitive positioning requires live competitor analysis',
        'Market disruption trends to be mapped against current capabilities',
      ],
      opportunities: [
        'End-to-end supply chain visibility and control tower implementation',
        'Working capital optimization through DPO/DIO improvements',
        'Digital SC portal for customer and supplier collaboration',
        'AI-driven demand sensing and forecast accuracy improvements',
        'Circular economy and reverse logistics monetization',
      ],
    },
    scServices: [
      { text: 'Supply Chain Management', color: 'green' },
      { text: 'Procurement & Sourcing', color: 'green' },
      { text: 'Manufacturing', color: 'green' },
      { text: 'Logistics & Distribution', color: 'blue' },
      { text: 'Aftermarket Services', color: 'blue' },
    ],
    industriesServed: [industry, 'Cross-Industry'],
    strategyStats: [
      { label: 'Core SC Value Prop', value: 'Pending website analysis' },
      { label: 'Key Partnerships', value: 'Pending research' },
      { label: 'Geographic Coverage', value: 'Pending analysis' },
    ],
    valueChain: [
      { phase: 'plan', name: 'Demand Planning & S&OP', status: 'developing', bullets: ['Forecast methods TBD', 'S&OP maturity TBD'] },
      { phase: 'source', name: 'Procurement & Supplier Mgmt', status: 'developing', bullets: ['Supplier base TBD', 'Spend analytics TBD'] },
      { phase: 'make', name: 'Manufacturing', status: 'developing', bullets: ['Facility footprint TBD', 'Automation level TBD'] },
      { phase: 'deliver', name: 'Fulfillment & Logistics', status: 'developing', bullets: ['Distribution network TBD', 'Last-mile TBD'] },
      { phase: 'return', name: 'Aftermarket & Returns', status: 'developing', bullets: ['Reverse logistics TBD', 'Circular economy TBD'] },
    ],
    industryOverview: {
      stats: [
        { label: `Global ${industry} Market`, value: 'Pending SerpAPI research' },
        { label: `${companyName} Market Position`, value: 'Pending analysis' },
        { label: 'Key Market Driver', value: 'Pending research' },
      ],
      trends: [
        { text: 'AI and digital transformation reshaping supply chains', color: 'blue' },
        { text: 'Supply chain resilience and regionalization', color: 'warn' },
        { text: 'ESG and sustainability mandates increasing', color: 'green' },
        { text: 'Cost pressures and margin compression', color: 'red' },
      ],
    },
    financials: [
      { label: 'FY2022', revenue: 0, cogs: 0, grossMarginPct: 0 },
      { label: 'FY2023', revenue: 0, cogs: 0, grossMarginPct: 0, yoyGrowthPct: 0 },
      { label: 'FY2024', revenue: 0, cogs: 0, grossMarginPct: 0, yoyGrowthPct: 0, ebit: 0, ebitMarginPct: 0 },
    ],
    workingCapital: { dso: 0, dio: 0, dpo: 0, c2c: 0, inventoryTurns: 0 },
    comparisonTable: [
      { label: 'Revenue Scale', values: [{ text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }] },
      { label: 'EBIT Margin', values: [{ text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }] },
      { label: 'Cash-to-Cash Cycle', values: [{ text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }] },
      { label: 'Inventory Turns', values: [{ text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }] },
      { label: 'Digital SC Portal', values: [{ text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }, { text: 'TBD', status: 'partial' }] },
    ],
    gaps: [
      { priority: 'high', category: 'Working Capital', title: 'Working capital efficiency to be benchmarked', description: 'Full gap analysis requires live financial data from target and competitors.', impact: 'Pending quantification', betterAtThis: ['Pending competitor analysis'] },
      { priority: 'high', category: 'Digital SC', title: 'Digital supply chain maturity assessment needed', description: 'Evaluate target vs. competitors on SC visibility, portals, and AI capabilities.', impact: 'Strategic impact on enterprise deals', betterAtThis: ['Pending analysis'] },
      { priority: 'medium', category: 'Planning', title: 'Demand planning maturity gap', description: 'Assess AI/ML adoption in demand sensing vs. competitor capabilities.', impact: 'Operational efficiency impact', betterAtThis: ['Pending analysis'] },
      { priority: 'medium', category: 'Procurement', title: 'Supplier payment terms optimization', description: 'DPO benchmarking against best-in-class peers.', impact: 'Cash release potential', betterAtThis: ['Pending analysis'] },
    ],
    recommendations: [
      { number: 1, title: 'Benchmark Working Capital Metrics', description: 'Collect DSO, DIO, DPO data for target and all competitors to quantify the cash optimization opportunity.', horizon: 'quick-win', impact: 'high', effort: 'low', timeline: '1-2 weeks' },
      { number: 2, title: 'Assess Digital SC Capabilities', description: 'Evaluate customer portals, supplier collaboration platforms, and SC visibility tools across all players.', horizon: 'quick-win', impact: 'high', effort: 'low', timeline: '1-2 weeks' },
      { number: 3, title: 'Map Value Chain End-to-End', description: 'Document full Plan-Source-Make-Deliver-Return capabilities with bottleneck identification.', horizon: 'mid-term', impact: 'high', effort: 'medium', timeline: '4-6 weeks' },
      { number: 4, title: 'Build SC Control Tower Roadmap', description: 'Design AI-powered supply chain visibility platform based on gap analysis findings.', horizon: 'mid-term', impact: 'high', effort: 'high', timeline: '3-6 months' },
      { number: 5, title: 'Optimize Supplier Payment Terms', description: 'Implement supply chain financing program to extend DPO while maintaining supplier relationships.', horizon: 'mid-term', impact: 'high', effort: 'medium', wcImpact: 'Cash release TBD', timeline: '3-6 months' },
      { number: 6, title: 'Launch Digital SC Customer Portal', description: 'Deploy external-facing portal for real-time order visibility, SC collaboration, and reporting.', horizon: 'strategic', impact: 'high', effort: 'high', timeline: '6-12 months' },
      { number: 7, title: 'Implement AI Demand Sensing', description: 'Deploy ML-based demand sensing to improve forecast accuracy and reduce buffer inventory.', horizon: 'strategic', impact: 'high', effort: 'high', wcImpact: 'Inventory reduction 20-35%', timeline: '6-18 months' },
    ],
    quickWins: [
      { number: '01', title: 'Collect Financial Benchmarks', description: 'Pull public financial data for target and competitors. Calculate DSO, DIO, DPO, C2C, inventory turns.', days: '1 week', impactEstimate: 'Foundation for all WC recommendations' },
      { number: '02', title: 'Website SC Capability Audit', description: 'Systematically review all company websites for SC services, digital tools, and capability claims.', days: '1 week', impactEstimate: 'Competitive positioning clarity' },
      { number: '03', title: 'Identify DPO Extension Targets', description: 'Review top supplier payment terms and benchmark against best-in-class DPO in the industry.', days: '2 weeks', impactEstimate: 'Cash release sizing' },
      { number: '04', title: 'Map SC Technology Stack', description: 'Document ERP, TMS, WMS, and planning tools across target and competitors from public sources.', days: '2 weeks', impactEstimate: 'Digital gap quantification' },
      { number: '05', title: 'Inventory ABC/XYZ Analysis Brief', description: 'Outline the methodology for inventory segmentation and SLOB identification.', days: '1 week', impactEstimate: 'DIO reduction roadmap' },
      { number: '06', title: 'Publish SC KPI Dashboard Concept', description: 'Design a public-facing SC performance page concept to differentiate vs. competitors.', days: '2 weeks', impactEstimate: 'First-mover positioning' },
    ],
  };

  return report;
}

function createPlaceholderCompetitor(
  name: string,
  shortName: string,
  industry: string,
  colorFrom: string,
  colorTo: string
) {
  return {
    name,
    shortName,
    tagline: `${industry} competitor — pending analysis`,
    website: 'pending.com',
    colorFrom,
    colorTo,
    financials: [
      { label: 'FY2024', revenue: 0, cogs: 0, grossMarginPct: 0, ebitMarginPct: 0 },
    ],
    workingCapital: { dso: 0, dio: 0, dpo: 0, c2c: 0, inventoryTurns: 0 },
    scMaturity: {
      demandPlanning: 5,
      inventoryOptimization: 5,
      supplierCollaboration: 5,
      mfgFlexibility: 5,
      logisticsNetwork: 5,
      digitalScAi: 5,
      resilienceRisk: 5,
    },
    namedScServices: 3,
    kpiHighlights: [
      { label: 'Revenue', value: 'TBD', sub: 'Pending research' },
      { label: 'Inventory Turns', value: 'TBD', sub: 'Pending' },
      { label: 'C2C Cycle', value: 'TBD', sub: 'Pending' },
      { label: 'EBIT Margin', value: 'TBD', sub: 'Pending' },
    ],
    strengths: [
      { text: 'Competitive strengths pending analysis' },
    ],
    weaknesses: [
      { text: 'Competitive weaknesses pending analysis' },
    ],
    differentiators: [
      'Key differentiators pending analysis',
    ],
  };
}
