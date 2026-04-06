'use client';

import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessment-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MaturityHeatmap } from '@/components/charts/maturity-heatmap';
import { KpiRadarChart } from '@/components/charts/kpi-radar-chart';
import { InsightDetail } from '@/components/workshop/insight-detail';
import { maturityLabel, formatPercent } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const assessment = useAssessmentStore((s) => s.assessment);

  if (!assessment) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">No Assessment Found</h2>
        <p className="text-muted-foreground">Create an assessment first to view the dashboard.</p>
        <Button onClick={() => router.push('/')}>Create Assessment</Button>
      </div>
    );
  }

  const { clientProfile, topics, insights, kpis, opportunities } = assessment;

  // Summary stats
  const avgMaturity =
    topics.reduce((sum, t) => sum + t.currentMaturity, 0) / topics.length;
  const avgConfidence =
    topics.reduce((sum, t) => sum + t.confidence, 0) / topics.length;
  const criticalInsights = insights.filter((i) => i.severity === 'critical').length;
  const totalImpactLow = opportunities.reduce((s, o) => s + o.estimatedImpact.low, 0);
  const totalImpactHigh = opportunities.reduce((s, o) => s + o.estimatedImpact.high, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assessment Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {clientProfile.name} · {clientProfile.industry} · {clientProfile.region}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Average Maturity</CardDescription>
            <CardTitle className="text-2xl">{avgMaturity.toFixed(1)} / 5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {maturityLabel(Math.round(avgMaturity))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Confidence</CardDescription>
            <CardTitle className="text-2xl">{formatPercent(avgConfidence * 100)}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {assessment.validationLog.length} questions answered
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical Insights</CardDescription>
            <CardTitle className="text-2xl">{criticalInsights}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {insights.length} total insights
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Value at Stake</CardDescription>
            <CardTitle className="text-2xl">
              ${totalImpactLow}–{totalImpactHigh}M
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {opportunities.length} opportunities identified
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Maturity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Maturity Heatmap</CardTitle>
          <CardDescription>
            Current maturity scores across {topics.length} assessment topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaturityHeatmap topics={topics} />
        </CardContent>
      </Card>

      {/* KPI Radar */}
      <Card>
        <CardHeader>
          <CardTitle>KPI Performance</CardTitle>
          <CardDescription>Current vs target vs industry benchmark</CardDescription>
        </CardHeader>
        <CardContent>
          <KpiRadarChart kpis={kpis} />
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                {insights.length} insights — sorted by severity
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/workshop')}>
              Open Workshop
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights
            .sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
            })
            .slice(0, 6)
            .map((insight) => (
              <InsightDetail key={insight.id} insight={insight} />
            ))}
          {insights.length > 6 && (
            <p className="text-sm text-muted-foreground text-center pt-2">
              +{insights.length - 6} more insights. Open the Workshop to explore all.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Improvement Opportunities</CardTitle>
              <CardDescription>Ranked by estimated impact</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/simulation')}>
              Run Simulation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {opportunities
              .sort((a, b) => b.estimatedImpact.high - a.estimatedImpact.high)
              .map((opp) => (
                <div key={opp.id} className="flex items-start gap-3 rounded-md border p-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{opp.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{opp.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{opp.timeline}</Badge>
                      <Badge variant="secondary">{opp.effort} effort</Badge>
                      <Badge>{opp.benefitCategory}</Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-sm text-primary">
                      ${opp.estimatedImpact.low}–{opp.estimatedImpact.high}
                      {opp.estimatedImpact.unit}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
