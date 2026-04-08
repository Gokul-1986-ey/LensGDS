/**
 * Converts a completed AuditReport into an Assessment so the
 * Dashboard / Workshop / Simulation / Export tabs reflect real audit data.
 */
import { generateId } from '@/lib/utils';
import type { AuditReport, GapAnalysisItem } from '@/types/audit';
import type {
  Assessment,
  ClientProfile,
  AssessmentTopic,
  Insight,
  InsightCategory,
  KPI,
  Opportunity,
  BenefitHeuristic,
  ValidationQuestion,
  MaturityLevel,
  Industry,
  RevenueBand,
} from '@/types/domain';

// ─── Industry mapping ─────────────────────────────────────────────────────────

function mapIndustry(industry: string): Industry {
  const l = industry.toLowerCase();
  if (l.includes('cpg') || l.includes('consumer packaged') || l.includes('fmcg')) return 'cpg';
  if (l.includes('pharma') || l.includes('health') || l.includes('biotech')) return 'pharma';
  if (l.includes('manufacturing') || l.includes('industrial') || l.includes('ems') || l.includes('electronics')) return 'industrial-manufacturing';
  if (l.includes('retail') || l.includes('e-commerce') || l.includes('ecommerce')) return 'retail';
  if (l.includes('auto')) return 'automotive';
  if (l.includes('chem')) return 'chemicals';
  if (l.includes('tech') || l.includes('software') || l.includes('saas') || l.includes('cloud')) return 'technology';
  return 'other';
}

function mapRevenueBand(financials: AuditReport['financials']): RevenueBand {
  if (!financials.length) return '1b-5b';
  const revenue = financials[financials.length - 1].revenue; // in billions
  if (revenue < 0.5) return 'under-500m';
  if (revenue < 1)   return '500m-1b';
  if (revenue < 5)   return '1b-5b';
  if (revenue < 20)  return '5b-20b';
  return 'over-20b';
}

// ─── Topics from value chain ──────────────────────────────────────────────────

function statusToCurrentMaturity(status: 'strong' | 'developing' | 'gap'): MaturityLevel {
  return status === 'strong' ? 4 : status === 'developing' ? 3 : 2;
}

function statusToTargetMaturity(status: 'strong' | 'developing' | 'gap'): MaturityLevel {
  return status === 'strong' ? 5 : 4;
}

const PHASE_KPI_MAP: Record<string, string[]> = {
  plan:    ['inventory-turns', 'c2c'],
  source:  ['dpo', 'gross-margin'],
  make:    ['gross-margin', 'ebit-margin'],
  deliver: ['dso', 'c2c'],
  return:  ['ebit-margin'],
};

function buildTopics(report: AuditReport): AssessmentTopic[] {
  const vcTopics: AssessmentTopic[] = report.valueChain.map((step) => ({
    id: step.phase,
    label: step.name,
    description: step.bullets.join(' '),
    category: step.phase,
    currentMaturity: statusToCurrentMaturity(step.status),
    targetMaturity: statusToTargetMaturity(step.status),
    confidence: 0.75,
    relatedKpis: PHASE_KPI_MAP[step.phase] ?? [],
  }));

  // Derive digital + resilience scores from average competitor benchmarks (scaled 1-10 → 1-5)
  const avgDigital = report.competitors.length
    ? report.competitors.reduce((s, c) => s + c.scMaturity.digitalScAi, 0) / report.competitors.length
    : 7;
  const avgResilience = report.competitors.length
    ? report.competitors.reduce((s, c) => s + c.scMaturity.resilienceRisk, 0) / report.competitors.length
    : 6;

  // Target company inferred as 70% of best competitor (gaps imply it's behind)
  const hasDigitalGap  = report.gaps.some((g) => /digital|ai|data|tech/i.test(g.category + g.title));
  const hasResilienceGap = report.gaps.some((g) => /resilien|risk|disruption/i.test(g.category + g.title));

  const digitalCurrent  = Math.max(1, Math.min(4, Math.round((avgDigital * 0.5) * (hasDigitalGap ? 0.75 : 1)))) as MaturityLevel;
  const resilienceCurrent = Math.max(1, Math.min(4, Math.round((avgResilience * 0.5) * (hasResilienceGap ? 0.75 : 1)))) as MaturityLevel;

  return [
    ...vcTopics,
    {
      id: 'digital-sc',
      label: 'Digital SC & AI',
      description: 'Adoption of digital tools, AI/ML, real-time visibility, and automation across the supply chain.',
      category: 'digital',
      currentMaturity: digitalCurrent,
      targetMaturity: Math.min(5, (digitalCurrent + 2)) as MaturityLevel,
      confidence: 0.65,
      relatedKpis: ['inventory-turns', 'gross-margin'],
    },
    {
      id: 'resilience',
      label: 'SC Resilience & Risk',
      description: 'Ability to withstand and recover from supply chain disruptions, geopolitical risks, and climate events.',
      category: 'resilience',
      currentMaturity: resilienceCurrent,
      targetMaturity: Math.min(5, (resilienceCurrent + 2)) as MaturityLevel,
      confidence: 0.65,
      relatedKpis: ['ebit-margin'],
    },
  ];
}

// ─── Insights from gaps ───────────────────────────────────────────────────────

function mapInsightCategory(cat: string): InsightCategory {
  const l = cat.toLowerCase();
  if (l.includes('inventor')) return 'inventory';
  if (l.includes('financial') || l.includes('cost') || l.includes('working capital')) return 'financial';
  if (l.includes('compet')) return 'competitive';
  if (l.includes('segment') || l.includes('customer')) return 'segment';
  if (l.includes('footprint') || l.includes('network') || l.includes('logistics')) return 'footprint';
  return 'general';
}

function generateValidationQuestions(gap: GapAnalysisItem, insightId: string): ValidationQuestion[] {
  return [
    {
      id: generateId(),
      insightId,
      questionText: `Has "${gap.title}" been formally identified as a gap in internal supply chain reviews?`,
      answerType: 'yes-no',
      category: 'confirming',
      affectedTopicIds: [],
      impactMapping: { confirmDelta: 0.12, contradictDelta: -0.12, unknownDelta: 0 },
    },
    {
      id: generateId(),
      insightId,
      questionText: `What is the estimated annual financial impact of closing this gap? (e.g. "$50M cost reduction")`,
      answerType: 'free-text',
      category: 'quantifying',
      affectedTopicIds: [],
      impactMapping: { confirmDelta: 0.06, contradictDelta: 0, unknownDelta: 0 },
    },
    {
      id: generateId(),
      insightId,
      questionText: `Which competitor capability in "${gap.category}" should be benchmarked first?`,
      answerType: 'select-one',
      options: gap.betterAtThis.length ? gap.betterAtThis : ['Internal benchmark', 'Industry average'],
      category: 'exploring',
      affectedTopicIds: [],
      impactMapping: { confirmDelta: 0.04, contradictDelta: 0, unknownDelta: 0 },
    },
  ];
}

function buildInsights(report: AuditReport): Insight[] {
  const insights: Insight[] = report.gaps.map((gap) => {
    const id = generateId();
    return {
      id,
      claim: gap.title,
      category: mapInsightCategory(gap.category),
      severity: gap.priority === 'high' ? 'critical' : gap.priority === 'medium' ? 'high' : 'medium',
      confidence: gap.priority === 'high' ? 0.8 : 0.65,
      evidence: [
        gap.description,
        ...gap.betterAtThis.map((c) => `${c} demonstrates stronger capability in ${gap.category}`),
      ],
      relatedTopicIds: [],
      relatedKpiIds: [],
      assumptions: [`Based on competitive benchmarking vs ${gap.betterAtThis.join(', ') || 'industry peers'}`],
      maturityImplication: gap.priority === 'high' ? 'high' : 'medium',
      financialImpactEstimate: gap.impact,
      needsValidation: true,
      validationQuestions: generateValidationQuestions(gap, id),
    };
  });

  // Also add top risks as low-severity insights
  report.riskOpportunities.risks.slice(0, 3).forEach((risk) => {
    const id = generateId();
    insights.push({
      id,
      claim: risk,
      category: 'general',
      severity: 'medium',
      confidence: 0.6,
      evidence: [],
      relatedTopicIds: [],
      relatedKpiIds: [],
      assumptions: ['Derived from strategic risk analysis'],
      maturityImplication: 'medium',
      needsValidation: false,
      validationQuestions: [],
    });
  });

  return insights;
}

// ─── KPIs from working capital + financials ───────────────────────────────────

function buildKpis(report: AuditReport): KPI[] {
  const wc = report.workingCapital;
  const latest = report.financials.length ? report.financials[report.financials.length - 1] : null;

  // Best competitor for benchmarks
  const bestC2C = [...report.competitors].sort((a, b) => a.workingCapital.c2c - b.workingCapital.c2c)[0];
  const bestTurns = [...report.competitors].sort((a, b) => b.workingCapital.inventoryTurns - a.workingCapital.inventoryTurns)[0];
  const bestMargin = latest
    ? [...report.competitors].sort((a, b) => {
        const aM = a.financials[a.financials.length - 1]?.grossMarginPct ?? 0;
        const bM = b.financials[b.financials.length - 1]?.grossMarginPct ?? 0;
        return bM - aM;
      })[0]
    : null;

  const kpis: KPI[] = [
    {
      id: 'c2c',
      label: 'Cash-to-Cash Cycle',
      unit: 'days',
      baselineValue: wc.c2c,
      targetValue: bestC2C ? Math.round(bestC2C.workingCapital.c2c * 1.05) : undefined,
      industryBenchmark: bestC2C?.workingCapital.c2c,
      category: 'working-capital',
    },
    {
      id: 'dso',
      label: 'Days Sales Outstanding',
      unit: 'days',
      baselineValue: wc.dso,
      targetValue: bestC2C ? Math.round(bestC2C.workingCapital.dso * 1.05) : undefined,
      industryBenchmark: bestC2C?.workingCapital.dso,
      category: 'working-capital',
    },
    {
      id: 'dio',
      label: 'Days Inventory Outstanding',
      unit: 'days',
      baselineValue: wc.dio,
      targetValue: bestC2C ? Math.round(bestC2C.workingCapital.dio * 1.05) : undefined,
      industryBenchmark: bestC2C?.workingCapital.dio,
      category: 'working-capital',
    },
    {
      id: 'dpo',
      label: 'Days Payable Outstanding',
      unit: 'days',
      baselineValue: wc.dpo,
      targetValue: bestC2C ? Math.round(bestC2C.workingCapital.dpo * 0.95) : undefined,
      industryBenchmark: bestC2C?.workingCapital.dpo,
      category: 'working-capital',
    },
    {
      id: 'inventory-turns',
      label: 'Inventory Turns',
      unit: 'x/yr',
      baselineValue: wc.inventoryTurns,
      targetValue: bestTurns ? +(bestTurns.workingCapital.inventoryTurns * 0.95).toFixed(1) : undefined,
      industryBenchmark: bestTurns?.workingCapital.inventoryTurns,
      category: 'inventory',
    },
  ];

  if (latest) {
    kpis.push(
      {
        id: 'gross-margin',
        label: 'Gross Margin',
        unit: '%',
        baselineValue: +latest.grossMarginPct.toFixed(1),
        targetValue: bestMargin
          ? +(bestMargin.financials[bestMargin.financials.length - 1]?.grossMarginPct * 0.95).toFixed(1)
          : undefined,
        industryBenchmark: bestMargin
          ? +(bestMargin.financials[bestMargin.financials.length - 1]?.grossMarginPct).toFixed(1)
          : undefined,
        category: 'financial',
      },
      {
        id: 'ebit-margin',
        label: 'EBIT Margin',
        unit: '%',
        baselineValue: +(latest.ebitMarginPct ?? 0).toFixed(1),
        category: 'financial',
      }
    );
  }

  return kpis;
}

// ─── Opportunities from recommendations ───────────────────────────────────────

function parseImpactNumbers(text: string): { low: number; high: number; unit: string } {
  // Try to extract patterns like "$50-100M" or "$2.5B" or "50-100M"
  const match = text.match(/\$?([\d.]+)\s*[-–to]+\s*\$?([\d.]+)\s*([MBK])/i)
    || text.match(/\$?([\d.]+)\s*([MBK])/i);
  if (match) {
    const [, a, b, unit] = match.length >= 4 ? match : [, match[1], String(+match[1] * 1.5), match[2]];
    return { low: parseFloat(a), high: parseFloat(b), unit: unit.toUpperCase() };
  }
  return { low: 10, high: 50, unit: 'M' };
}

type BenefitCat = 'value' | 'cost' | 'service' | 'working-capital' | 'risk';

function inferBenefitCategory(rec: AuditReport['recommendations'][0]): BenefitCat {
  const text = (rec.title + ' ' + rec.description + ' ' + (rec.wcImpact ?? '')).toLowerCase();
  if (text.includes('working capital') || text.includes('cash') || text.includes('c2c') || text.includes('inventory')) return 'working-capital';
  if (text.includes('cost') || text.includes('saving') || text.includes('reduc')) return 'cost';
  if (text.includes('service') || text.includes('otif') || text.includes('fill rate') || text.includes('customer')) return 'service';
  if (text.includes('risk') || text.includes('resilien') || text.includes('continuity')) return 'risk';
  return 'value';
}

function mapHorizon(h: string): 'quick-win' | 'medium-term' | 'strategic' {
  if (h === 'quick-win') return 'quick-win';
  if (h === 'mid-term')  return 'medium-term';
  return 'strategic';
}

function buildOpportunities(report: AuditReport): Opportunity[] {
  const opps: Opportunity[] = report.recommendations.map((rec) => {
    const impact = rec.wcImpact ? parseImpactNumbers(rec.wcImpact) : { low: 10, high: 50, unit: 'M' };
    return {
      id: generateId(),
      title: rec.title,
      description: rec.description,
      topicIds: [],
      effort: rec.effort,
      timeline: mapHorizon(rec.horizon),
      benefitCategory: inferBenefitCategory(rec),
      estimatedImpact: impact,
      dependencies: [],
      stakeholderSponsor: 'CSCO / COO',
      risks: [],
    };
  });

  // Add quick wins
  report.quickWins.forEach((qw) => {
    const impact = parseImpactNumbers(qw.impactEstimate);
    opps.push({
      id: generateId(),
      title: qw.title,
      description: qw.description,
      topicIds: [],
      effort: 'low',
      timeline: 'quick-win',
      benefitCategory: 'working-capital',
      estimatedImpact: impact,
      dependencies: [],
      risks: [],
    });
  });

  return opps;
}

// ─── Heuristics (simulation engine) ──────────────────────────────────────────

function buildHeuristics(topics: AssessmentTopic[]): BenefitHeuristic[] {
  const heuristics: BenefitHeuristic[] = [];

  topics.forEach((topic, i) => {
    // Map each topic→KPI relationship with reasonable SC heuristics
    const mappings: Array<{ kpiId: string; low: number; high: number; desc: string }> = [];

    switch (topic.id) {
      case 'plan':
        mappings.push(
          { kpiId: 'inventory-turns', low: 0.3, high: 0.7, desc: 'Better demand planning drives inventory turns improvement.' },
          { kpiId: 'c2c', low: -3, high: -6, desc: 'Planning maturity reduces cash-to-cash cycle by 3-6 days per level.' },
          { kpiId: 'dio', low: -4, high: -8, desc: 'Improved forecasting reduces days inventory outstanding.' }
        );
        break;
      case 'source':
        mappings.push(
          { kpiId: 'dpo', low: 2, high: 5, desc: 'Stronger procurement extends payable terms by 2-5 days.' },
          { kpiId: 'gross-margin', low: 0.4, high: 1.0, desc: 'Strategic sourcing improves gross margin 0.4-1.0% per level.' }
        );
        break;
      case 'make':
        mappings.push(
          { kpiId: 'gross-margin', low: 0.3, high: 0.7, desc: 'Manufacturing excellence improves gross margin.' },
          { kpiId: 'ebit-margin', low: 0.2, high: 0.5, desc: 'Lean / OEE gains flow through to EBIT margin.' }
        );
        break;
      case 'deliver':
        mappings.push(
          { kpiId: 'dso', low: -1.5, high: -3, desc: 'Delivery excellence accelerates invoicing and collections.' },
          { kpiId: 'c2c', low: -2, high: -4, desc: 'Logistics optimisation shortens cash conversion cycle.' }
        );
        break;
      case 'return':
        mappings.push(
          { kpiId: 'gross-margin', low: 0.1, high: 0.3, desc: 'Efficient returns reduce margin drag.' }
        );
        break;
      case 'digital-sc':
        mappings.push(
          { kpiId: 'inventory-turns', low: 0.2, high: 0.5, desc: 'Digital tools and AI improve inventory velocity.' },
          { kpiId: 'gross-margin', low: 0.2, high: 0.5, desc: 'Automation and visibility reduce operational cost.' }
        );
        break;
      case 'resilience':
        mappings.push(
          { kpiId: 'ebit-margin', low: 0.1, high: 0.3, desc: 'Supply chain resilience reduces disruption-related EBIT loss.' }
        );
        break;
    }

    mappings.forEach((m, j) => {
      heuristics.push({
        id: `bh-${i}-${j}`,
        topicId: topic.id,
        kpiId: m.kpiId,
        perMaturityPointImprovement: { low: m.low, high: m.high },
        description: m.desc,
      });
    });
  });

  return heuristics;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function auditToAssessment(
  report: AuditReport
): { assessment: Assessment; heuristics: BenefitHeuristic[] } {
  const profile: ClientProfile = {
    id: generateId(),
    name: report.targetCompany.name,
    industry: mapIndustry(report.industry),
    region: 'global',
    revenueBand: mapRevenueBand(report.financials),
    description:
      report.strategicNarrative.replace(/<[^>]+>/g, '').slice(0, 500) ||
      `${report.targetCompany.name} — ${report.industry} supply chain audit.`,
    createdAt: new Date().toISOString(),
  };

  const topics = buildTopics(report);
  const insights = buildInsights(report);
  const kpis = buildKpis(report);
  const opportunities = buildOpportunities(report);
  const heuristics = buildHeuristics(topics);

  const assessment: Assessment = {
    id: generateId(),
    clientProfile: profile,
    topics,
    insights,
    opportunities,
    kpis,
    validationLog: [],
    simulationScenarios: [],
    dataSources: [],
    status: 'in-progress',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { assessment, heuristics };
}
