// ─── Core Domain Types ──────────────────────────────────────

export type RevenueBand =
  | 'under-500m'
  | '500m-1b'
  | '1b-5b'
  | '5b-20b'
  | 'over-20b';

export type Industry =
  | 'cpg'
  | 'pharma'
  | 'industrial-manufacturing'
  | 'retail'
  | 'automotive'
  | 'chemicals'
  | 'technology'
  | 'other';

export type Region =
  | 'north-america'
  | 'europe'
  | 'asia-pacific'
  | 'latin-america'
  | 'middle-east-africa'
  | 'global';

export interface ClientProfile {
  id: string;
  name: string;
  industry: Industry;
  region: Region;
  revenueBand: RevenueBand;
  description: string;
  createdAt: string;
}

export interface DataSource {
  id: string;
  type: 'annual-report' | 'web-research' | 'user-input' | 'api';
  label: string;
  content: string;
  uploadedAt: string;
}

// ─── Assessment Model ───────────────────────────────────────

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export interface AssessmentTopic {
  id: string;
  label: string;
  description: string;
  category: string;
  currentMaturity: MaturityLevel;
  targetMaturity: MaturityLevel;
  confidence: number; // 0-1
  relatedKpis: string[];
}

export interface Assessment {
  id: string;
  clientProfile: ClientProfile;
  topics: AssessmentTopic[];
  insights: Insight[];
  opportunities: Opportunity[];
  kpis: KPI[];
  validationLog: ValidationLogEntry[];
  simulationScenarios: SimulationScenario[];
  dataSources: DataSource[];
  status: 'draft' | 'in-progress' | 'validated' | 'complete';
  createdAt: string;
  updatedAt: string;
}

// ─── Insights ───────────────────────────────────────────────

export type InsightCategory =
  | 'financial'
  | 'competitive'
  | 'segment'
  | 'portfolio'
  | 'footprint'
  | 'inventory'
  | 'stakeholder'
  | 'general';

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface Insight {
  id: string;
  claim: string;
  category: InsightCategory;
  severity: InsightSeverity;
  confidence: number;
  evidence: string[];
  relatedTopicIds: string[];
  relatedKpiIds: string[];
  assumptions: string[];
  maturityImplication: 'low' | 'medium' | 'high';
  financialImpactEstimate?: string;
  needsValidation: boolean;
  validationQuestions: ValidationQuestion[];
}

// ─── Validation / Workshop ──────────────────────────────────

export type QuestionType =
  | 'yes-no'
  | 'select-one'
  | 'numeric'
  | 'slider'
  | 'free-text';

export type QuestionCategory =
  | 'confirming'
  | 'quantifying'
  | 'exploring'
  | 'challenging';

export interface ValidationQuestion {
  id: string;
  insightId: string;
  questionText: string;
  answerType: QuestionType;
  options?: string[];
  category: QuestionCategory;
  targetStakeholder?: string;
  affectedTopicIds: string[];
  impactMapping: {
    confirmDelta: number;
    contradictDelta: number;
    unknownDelta: number;
  };
  answer?: string | number | boolean;
  answeredAt?: string;
}

export interface ValidationLogEntry {
  id: string;
  questionId: string;
  insightId: string;
  previousConfidence: number;
  newConfidence: number;
  answer: string | number | boolean;
  timestamp: string;
}

// ─── KPIs ───────────────────────────────────────────────────

export interface KPI {
  id: string;
  label: string;
  unit: string;
  baselineValue: number;
  targetValue?: number;
  industryBenchmark?: number;
  category: string;
}

// ─── Benefit Heuristics ─────────────────────────────────────

export interface BenefitHeuristic {
  id: string;
  topicId: string;
  kpiId: string;
  perMaturityPointImprovement: {
    low: number;
    high: number;
  };
  description: string;
}

// ─── Opportunities / Roadmap ────────────────────────────────

export type EffortLevel = 'low' | 'medium' | 'high';
export type TimelineHorizon = 'quick-win' | 'medium-term' | 'strategic';
export type BenefitCategory = 'value' | 'cost' | 'service' | 'working-capital' | 'risk';

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  topicIds: string[];
  effort: EffortLevel;
  timeline: TimelineHorizon;
  benefitCategory: BenefitCategory;
  estimatedImpact: {
    low: number;
    high: number;
    unit: string;
  };
  dependencies: string[];
  stakeholderSponsor?: string;
  risks: string[];
}

// ─── Simulation ─────────────────────────────────────────────

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  topicOverrides: Record<string, MaturityLevel>;
  kpiResults: SimulationKpiResult[];
  createdAt: string;
}

export interface SimulationKpiResult {
  kpiId: string;
  baselineValue: number;
  projectedLow: number;
  projectedHigh: number;
  delta: {
    low: number;
    high: number;
  };
}

export interface SimulationTradeoff {
  dimension1: string;
  dimension2: string;
  tension: string;
  recommendation: string;
}

// ─── New Types for Sprint 1 ─────────────────────────────────

export interface ClientFinancials {
  revenue: number;
  revenueGrowth: number;
  fiveYearCAGR: number;
  ebit: number;
  ebitMargin: number;
  tsr: { oneYear: number; threeYear: number; fiveYear: number };
  roic: number;
  assetEfficiency: number;
  cogs: number;
  cogsBreakdown: {
    materials: number;
    labor: number;
    overhead: number;
    logistics: number;
  };
  marginByProduct: { product: string; margin: number; revenueShare: number }[];
}

export interface InventoryMetrics {
  daysOfInventory: number;
  inventoryTurns: number;
  slobPct: number;
  stockoutRate: number;
  carryingCostPct: number;
  accuracyPct: number;
  categoryBreakdown: {
    rawMaterials: number;
    workInProgress: number;
    finishedGoods: number;
  };
  writeOffRate: number;
  inventoryToSalesRatio: number;
  safetyStockDays: number;
  totalInventoryValue: number;
  byLocation?: { location: string; valuePct: number; doi: number }[];
  byProduct?: { productFamily: string; valuePct: number; turns: number }[];
  ageProfile?: {
    fresh: number;
    normal: number;
    aging: number;
    atRisk: number;
  };
}

export interface Segment {
  id: string;
  name: string;
  marketSize: string;
  growthRate: number;
  clientShare: number;
  evolutionStage: 'growing' | 'mature' | 'declining' | 'disrupted';
  evolutionTrend: string;
  revenueContribution: number;
  marginContribution: number;
}

export interface Stakeholder {
  id: string;
  name: string;
  title: string;
  bio: string;
  yearsAtCompany: number;
  background: 'finance' | 'operations' | 'technology' | 'consulting' | 'sales' | 'engineering' | 'other';
  mandate: string;
  changeReadiness: 'high' | 'medium' | 'low';
  priorities: string[];
  concerns: string[];
}

export interface ProductSKU {
  totalSKUs: number;
  productFamilies: number;
  revenueConcentration: string;
  tailSKUPct: number;
  complexityScore: number;
  newProductRate: number;
  marginByProduct: { product: string; margin: number; revenueShare: number }[];
}
