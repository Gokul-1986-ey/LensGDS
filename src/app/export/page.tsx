'use client';

import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessment-store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { maturityLabel, maturityColor, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function ExportPage() {
  const router = useRouter();
  const assessment = useAssessmentStore((s) => s.assessment);

  if (!assessment) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">No Assessment Found</h2>
        <p className="text-muted-foreground">Create an assessment first.</p>
        <Button onClick={() => router.push('/')}>Create Assessment</Button>
      </div>
    );
  }

  const { clientProfile, topics, insights, kpis, opportunities, validationLog, simulationScenarios } = assessment;
  const avgMaturity = topics.reduce((s, t) => s + t.currentMaturity, 0) / topics.length;
  const avgConfidence = topics.reduce((s, t) => s + t.confidence, 0) / topics.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Export Summary</h1>
          <p className="text-muted-foreground mt-1">
            Print-friendly report with all assessment sections.
          </p>
        </div>
        <Button onClick={() => window.print()}>Print Report</Button>
      </div>

      {/* Client Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Client Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Company</p>
              <p className="font-medium">{clientProfile.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Industry</p>
              <p className="font-medium capitalize">{clientProfile.industry.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Region</p>
              <p className="font-medium capitalize">{clientProfile.region.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Revenue Band</p>
              <p className="font-medium">{clientProfile.revenueBand}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Description</p>
              <p className="font-medium">{clientProfile.description}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Maturity</p>
              <p className="font-medium">{avgMaturity.toFixed(1)} / 5 ({maturityLabel(Math.round(avgMaturity))})</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Confidence</p>
              <p className="font-medium">{formatPercent(avgConfidence * 100)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maturity Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Topic</th>
                <th className="text-left pb-2">Category</th>
                <th className="text-center pb-2">Current</th>
                <th className="text-center pb-2">Target</th>
                <th className="text-center pb-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {topics.map((topic) => (
                <tr key={topic.id} className="border-b">
                  <td className="py-2 font-medium">{topic.label}</td>
                  <td className="py-2 capitalize">{topic.category}</td>
                  <td className="py-2 text-center">
                    <span className={cn('inline-block w-6 h-6 rounded text-white text-xs leading-6 text-center', maturityColor(topic.currentMaturity))}>
                      {topic.currentMaturity}
                    </span>
                  </td>
                  <td className="py-2 text-center">
                    <span className={cn('inline-block w-6 h-6 rounded text-white text-xs leading-6 text-center', maturityColor(topic.targetMaturity))}>
                      {topic.targetMaturity}
                    </span>
                  </td>
                  <td className="py-2 text-center">{Math.round(topic.confidence * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* KPI Performance */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">KPI</th>
                <th className="text-right pb-2">Baseline</th>
                <th className="text-right pb-2">Target</th>
                <th className="text-right pb-2">Benchmark</th>
                <th className="text-right pb-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((kpi) => {
                const gap = (kpi.industryBenchmark ?? kpi.baselineValue) - kpi.baselineValue;
                return (
                  <tr key={kpi.id} className="border-b">
                    <td className="py-2 font-medium">{kpi.label}</td>
                    <td className="py-2 text-right font-mono">{kpi.baselineValue}{kpi.unit === '%' ? '%' : ` ${kpi.unit}`}</td>
                    <td className="py-2 text-right font-mono">{kpi.targetValue ?? '-'}{kpi.targetValue ? (kpi.unit === '%' ? '%' : ` ${kpi.unit}`) : ''}</td>
                    <td className="py-2 text-right font-mono">{kpi.industryBenchmark ?? '-'}{kpi.industryBenchmark ? (kpi.unit === '%' ? '%' : ` ${kpi.unit}`) : ''}</td>
                    <td className={`py-2 text-right font-mono ${gap > 0 ? 'text-red-600' : gap < 0 ? 'text-green-600' : ''}`}>
                      {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights ({insights.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights
            .sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
            })
            .map((insight, i) => (
              <div key={insight.id} className="border-b pb-3 last:border-0">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                  <div>
                    <p className="text-sm font-medium">{insight.claim}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant={insight.severity === 'critical' ? 'destructive' : insight.severity === 'high' ? 'default' : 'secondary'} className="text-[10px]">
                        {insight.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </span>
                      {insight.financialImpactEstimate && (
                        <span className="text-xs text-primary">{insight.financialImpactEstimate}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Improvement Roadmap */}
      <Card>
        <CardHeader>
          <CardTitle>Improvement Roadmap ({opportunities.length} Initiatives)</CardTitle>
        </CardHeader>
        <CardContent>
          {['quick-win', 'medium-term', 'strategic'].map((horizon) => {
            const items = opportunities.filter((o) => o.timeline === horizon);
            if (items.length === 0) return null;
            return (
              <div key={horizon} className="mb-6 last:mb-0">
                <h4 className="font-semibold text-sm capitalize mb-2">
                  {horizon.replace(/-/g, ' ')} ({items.length})
                </h4>
                <div className="space-y-2">
                  {items.map((opp) => (
                    <div key={opp.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{opp.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{opp.description}</p>
                        </div>
                        <p className="text-sm font-bold text-primary shrink-0">
                          ${opp.estimatedImpact.low}–{opp.estimatedImpact.high}{opp.estimatedImpact.unit}
                        </p>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <Badge variant="outline" className="text-[10px]">{opp.effort} effort</Badge>
                        <Badge variant="secondary" className="text-[10px]">{opp.benefitCategory}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="border-t pt-3 mt-4">
            <p className="text-sm font-medium">
              Total Estimated Value:{' '}
              <span className="text-primary">
                ${opportunities.reduce((s, o) => s + o.estimatedImpact.low, 0)}–
                ${opportunities.reduce((s, o) => s + o.estimatedImpact.high, 0)}M
              </span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      {validationLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              {validationLog.length} questions answered during workshop validation.
            </p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-1">Insight</th>
                  <th className="text-left pb-1">Answer</th>
                  <th className="text-right pb-1">Before</th>
                  <th className="text-right pb-1">After</th>
                </tr>
              </thead>
              <tbody>
                {validationLog.slice(-15).map((entry) => {
                  const insight = insights.find((i) => i.id === entry.insightId);
                  return (
                    <tr key={entry.id} className="border-b">
                      <td className="py-1 truncate max-w-[200px]">{insight?.claim?.slice(0, 60) ?? entry.insightId}</td>
                      <td className="py-1">{String(entry.answer)}</td>
                      <td className="py-1 text-right">{Math.round(entry.previousConfidence * 100)}%</td>
                      <td className="py-1 text-right">{Math.round(entry.newConfidence * 100)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Simulation Scenarios */}
      {simulationScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Scenarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {simulationScenarios.map((scenario) => (
              <div key={scenario.id} className="border rounded-md p-3">
                <p className="font-medium text-sm">{scenario.name}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  Created: {new Date(scenario.createdAt).toLocaleString()}
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-1">KPI</th>
                      <th className="text-right pb-1">Baseline</th>
                      <th className="text-right pb-1">Projected</th>
                      <th className="text-right pb-1">Delta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.kpiResults
                      .filter((r) => r.delta.low !== 0 || r.delta.high !== 0)
                      .map((result) => {
                        const kpi = kpis.find((k) => k.id === result.kpiId);
                        return (
                          <tr key={result.kpiId} className="border-b">
                            <td className="py-1">{kpi?.label ?? result.kpiId}</td>
                            <td className="py-1 text-right font-mono">{result.baselineValue.toFixed(1)}</td>
                            <td className="py-1 text-right font-mono">{result.projectedLow.toFixed(1)}–{result.projectedHigh.toFixed(1)}</td>
                            <td className="py-1 text-right font-mono text-green-600">
                              +{result.delta.low.toFixed(1)} to +{result.delta.high.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground border-t pt-4">
        <p>Value Chain Assessment & Simulation Platform — Generated {new Date().toLocaleDateString()}</p>
        <p>Assessment ID: {assessment.id} · Status: {assessment.status}</p>
      </div>
    </div>
  );
}
