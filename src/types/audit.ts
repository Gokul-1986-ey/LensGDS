// ─── Competitive Audit Types ────────────────────────────────

export interface AuditInput {
  targetUrl: string;
  industry: string;
}

export interface CompanyProfile {
  name: string;
  founded?: string;
  hq?: string;
  ceo?: string;
  ticker?: string;
  employees?: string;
  facilities?: string;
  scProfessionals?: string;
  supplierNetwork?: string;
  purchasingSpend?: string;
  businessModel?: string;
  website: string;
}

export interface FinancialYear {
  label: string;           // e.g. "FY2024"
  revenue: number;         // in billions
  cogs: number;
  grossMarginPct: number;
  yoyGrowthPct?: number;
  ebit?: number;
  ebitMarginPct?: number;
}

export interface WorkingCapitalMetrics {
  dso: number;             // Days Sales Outstanding
  dio: number;             // Days Inventory Outstanding
  dpo: number;             // Days Payable Outstanding
  c2c: number;             // Cash-to-Cash = DSO + DIO - DPO
  inventoryTurns: number;
}

export interface ScMaturityScores {
  demandPlanning: number;        // 1-10
  inventoryOptimization: number;
  supplierCollaboration: number;
  mfgFlexibility: number;
  logisticsNetwork: number;
  digitalScAi: number;
  resilienceRisk: number;
}

export interface CompetitorProfile {
  name: string;
  shortName: string;       // e.g. "foxconn", "jabil"
  tagline: string;
  website: string;
  colorFrom: string;       // gradient start
  colorTo: string;         // gradient end
  financials: FinancialYear[];
  workingCapital: WorkingCapitalMetrics;
  scMaturity: ScMaturityScores;
  namedScServices: number;
  kpiHighlights: { label: string; value: string; sub: string }[];
  strengths: { text: string; badge?: string }[];
  weaknesses: { text: string; badge?: string }[];
  differentiators: string[];
}

export interface ValueChainStep {
  phase: 'plan' | 'source' | 'make' | 'deliver' | 'return';
  name: string;
  status: 'strong' | 'developing' | 'gap';
  bullets: string[];
}

export interface GapAnalysisItem {
  priority: 'high' | 'medium' | 'low';
  category: string;        // e.g. "Inventory", "Procurement"
  title: string;
  description: string;
  impact: string;
  betterAtThis: string[];
}

export interface Recommendation {
  number: number;
  title: string;
  description: string;
  horizon: 'quick-win' | 'mid-term' | 'strategic';
  impact: 'high' | 'medium';
  effort: 'low' | 'medium' | 'high';
  wcImpact?: string;
  timeline: string;
}

export interface QuickWin {
  number: string;          // "01", "02", etc.
  title: string;
  description: string;
  days: string;
  impactEstimate: string;
}

export interface RiskOpportunity {
  risks: string[];
  opportunities: string[];
}

export interface IndustryOverview {
  stats: { label: string; value: string }[];
  trends: { text: string; color: 'red' | 'warn' | 'green' | 'blue' }[];
}

export interface ComparisonRow {
  label: string;
  values: { text: string; status: 'check' | 'cross' | 'partial' }[];
}

export interface AuditReport {
  targetCompany: CompanyProfile;
  industry: string;
  reportDate: string;
  competitors: CompetitorProfile[];

  // Section 01: Executive Summary
  execKpis: { label: string; value: string; sublabel: string; color: 'accent' | 'warn' | 'success' | 'danger' }[];
  strategicNarrative: string;
  riskOpportunities: RiskOpportunity;

  // Section 02: Company services/industries/strategy
  scServices: { text: string; color: 'green' | 'warn' | 'blue' }[];
  industriesServed: string[];
  strategyStats: { label: string; value: string }[];

  // Section 03: Industry & Value Chain
  valueChain: ValueChainStep[];
  industryOverview: IndustryOverview;

  // Section 04: Financials
  financials: FinancialYear[];
  workingCapital: WorkingCapitalMetrics;

  // Section 05-06: handled by competitors array + scMaturity

  // Section 07: Comparison table
  comparisonTable: ComparisonRow[];

  // Section 08: Gap Analysis
  gaps: GapAnalysisItem[];

  // Section 09: Recommendations
  recommendations: Recommendation[];

  // Section 10: Quick Wins
  quickWins: QuickWin[];
}
