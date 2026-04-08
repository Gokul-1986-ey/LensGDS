'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '@/lib/utils';
import type {
  Assessment,
  ClientProfile,
  AssessmentTopic,
  Insight,
  KPI,
  BenefitHeuristic,
  Opportunity,
  ValidationQuestion,
  ValidationLogEntry,
  SimulationScenario,
  SimulationKpiResult,
  MaturityLevel,
} from '@/types/domain';
import {
  DEFAULT_TOPICS,
  DEFAULT_INSIGHTS,
  DEFAULT_KPIS,
  DEFAULT_HEURISTICS,
  DEFAULT_OPPORTUNITIES,
  DEFAULT_QUESTIONS,
} from '@/data/mock-data';
import { auditToAssessment } from '@/lib/audit-to-assessment';
import type { AuditReport } from '@/types/audit';

interface AssessmentState {
  assessment: Assessment | null;
  heuristics: BenefitHeuristic[];

  // Actions
  createAssessment: (profile: ClientProfile) => void;
  populateFromAudit: (report: AuditReport) => void;
  clearAssessment: () => void;

  // Validation / Workshop
  answerQuestion: (questionId: string, answer: string | number | boolean) => void;

  // Simulation
  runSimulation: (
    name: string,
    topicOverrides: Record<string, MaturityLevel>
  ) => SimulationScenario;
  saveScenario: (scenario: SimulationScenario) => void;
  deleteScenario: (scenarioId: string) => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      assessment: null,
      heuristics: DEFAULT_HEURISTICS,

      createAssessment: (profile: ClientProfile) => {
        const assessment: Assessment = {
          id: generateId(),
          clientProfile: profile,
          topics: DEFAULT_TOPICS.map((t) => ({ ...t })),
          insights: DEFAULT_INSIGHTS.map((ins) => ({
            ...ins,
            validationQuestions: DEFAULT_QUESTIONS.filter((q) => q.insightId === ins.id).map(
              (q) => ({ ...q })
            ),
          })),
          opportunities: DEFAULT_OPPORTUNITIES.map((o) => ({ ...o })),
          kpis: DEFAULT_KPIS.map((k) => ({ ...k })),
          validationLog: [],
          simulationScenarios: [],
          dataSources: [],
          status: 'in-progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ assessment });
      },

      populateFromAudit: (report: AuditReport) => {
        const { assessment, heuristics } = auditToAssessment(report);
        set({ assessment, heuristics });
      },

      clearAssessment: () => set({ assessment: null }),

      answerQuestion: (questionId: string, answer: string | number | boolean) => {
        const { assessment } = get();
        if (!assessment) return;

        const updatedInsights = assessment.insights.map((insight) => {
          const questionIndex = insight.validationQuestions.findIndex(
            (q) => q.id === questionId
          );
          if (questionIndex === -1) return insight;

          const question = insight.validationQuestions[questionIndex];
          const previousConfidence = insight.confidence;

          // Determine confidence delta based on answer type
          let delta = question.impactMapping.confirmDelta;
          if (answer === false || answer === 'no' || answer === 'No') {
            delta = question.impactMapping.contradictDelta;
          }

          const newConfidence = Math.max(0, Math.min(1, insight.confidence + delta));

          // Update question
          const updatedQuestions = [...insight.validationQuestions];
          updatedQuestions[questionIndex] = {
            ...question,
            answer,
            answeredAt: new Date().toISOString(),
          };

          // Create log entry
          const logEntry: ValidationLogEntry = {
            id: generateId(),
            questionId,
            insightId: insight.id,
            previousConfidence,
            newConfidence,
            answer,
            timestamp: new Date().toISOString(),
          };

          // Add to log
          set((state) => {
            if (!state.assessment) return state;
            return {
              assessment: {
                ...state.assessment,
                validationLog: [...state.assessment.validationLog, logEntry],
              },
            };
          });

          return {
            ...insight,
            confidence: newConfidence,
            validationQuestions: updatedQuestions,
          };
        });

        // Also update topic confidence based on related insights
        const updatedTopics = assessment.topics.map((topic) => {
          const relatedInsights = updatedInsights.filter((i) =>
            i.relatedTopicIds.includes(topic.id)
          );
          if (relatedInsights.length === 0) return topic;
          const avgConfidence =
            relatedInsights.reduce((sum, i) => sum + i.confidence, 0) /
            relatedInsights.length;
          return { ...topic, confidence: avgConfidence };
        });

        set({
          assessment: {
            ...assessment,
            insights: updatedInsights,
            topics: updatedTopics,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      runSimulation: (
        name: string,
        topicOverrides: Record<string, MaturityLevel>
      ): SimulationScenario => {
        const { assessment, heuristics } = get();
        if (!assessment) {
          return {
            id: generateId(),
            name,
            description: 'No assessment loaded',
            topicOverrides,
            kpiResults: [],
            createdAt: new Date().toISOString(),
          };
        }

        // For each KPI, compute projected improvement
        const kpiResults: SimulationKpiResult[] = assessment.kpis.map((kpi) => {
          let totalDeltaLow = 0;
          let totalDeltaHigh = 0;

          // Find heuristics for this KPI
          const relatedHeuristics = heuristics.filter((h) => h.kpiId === kpi.id);

          for (const heuristic of relatedHeuristics) {
            const topic = assessment.topics.find((t) => t.id === heuristic.topicId);
            if (!topic) continue;

            const targetMaturity = topicOverrides[topic.id] ?? topic.currentMaturity;
            const maturityDelta = targetMaturity - topic.currentMaturity;

            if (maturityDelta > 0) {
              totalDeltaLow += maturityDelta * heuristic.perMaturityPointImprovement.low;
              totalDeltaHigh += maturityDelta * heuristic.perMaturityPointImprovement.high;
            }
          }

          return {
            kpiId: kpi.id,
            baselineValue: kpi.baselineValue,
            projectedLow: kpi.baselineValue + totalDeltaLow,
            projectedHigh: kpi.baselineValue + totalDeltaHigh,
            delta: { low: totalDeltaLow, high: totalDeltaHigh },
          };
        });

        return {
          id: generateId(),
          name,
          description: `Scenario: ${name}`,
          topicOverrides,
          kpiResults,
          createdAt: new Date().toISOString(),
        };
      },

      saveScenario: (scenario: SimulationScenario) => {
        const { assessment } = get();
        if (!assessment) return;
        set({
          assessment: {
            ...assessment,
            simulationScenarios: [...assessment.simulationScenarios, scenario],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      deleteScenario: (scenarioId: string) => {
        const { assessment } = get();
        if (!assessment) return;
        set({
          assessment: {
            ...assessment,
            simulationScenarios: assessment.simulationScenarios.filter(
              (s) => s.id !== scenarioId
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },
    }),
    {
      name: 'value-chain-assessment',
    }
  )
);
