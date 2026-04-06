'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useAssessmentStore } from '@/store/assessment-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { maturityLabel } from '@/lib/utils';
import type { MaturityLevel, SimulationScenario } from '@/types/domain';

export default function SimulationPage() {
  const router = useRouter();
  const assessment = useAssessmentStore((s) => s.assessment);
  const runSimulation = useAssessmentStore((s) => s.runSimulation);
  const saveScenario = useAssessmentStore((s) => s.saveScenario);
  const deleteScenario = useAssessmentStore((s) => s.deleteScenario);

  const [scenarioName, setScenarioName] = useState('Scenario 1');
  const [overrides, setOverrides] = useState<Record<string, MaturityLevel>>({});
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

  if (!assessment) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">No Assessment Found</h2>
        <p className="text-muted-foreground">Create an assessment first.</p>
        <Button onClick={() => router.push('/')}>Create Assessment</Button>
      </div>
    );
  }

  const { topics, kpis, simulationScenarios } = assessment;

  const handleSliderChange = (topicId: string, value: number) => {
    setOverrides((prev) => ({
      ...prev,
      [topicId]: value as MaturityLevel,
    }));
  };

  const handleRun = () => {
    const result = runSimulation(scenarioName, overrides);
    setActiveScenario(result);
  };

  const handleSave = () => {
    if (activeScenario) {
      saveScenario(activeScenario);
      setActiveScenario(null);
      setScenarioName(`Scenario ${simulationScenarios.length + 2}`);
      setOverrides({});
    }
  };

  // Chart data from active scenario
  const chartData = useMemo(() => {
    if (!activeScenario) return [];
    return activeScenario.kpiResults
      .filter((r) => r.delta.low !== 0 || r.delta.high !== 0)
      .map((result) => {
        const kpi = kpis.find((k) => k.id === result.kpiId);
        return {
          name: kpi?.label ?? result.kpiId,
          baseline: result.baselineValue,
          projectedLow: result.projectedLow,
          projectedHigh: result.projectedHigh,
        };
      });
  }, [activeScenario, kpis]);

  // Tradeoffs
  const tradeoffs = useMemo(() => {
    if (!activeScenario) return [];
    const results: { dimension1: string; dimension2: string; tension: string; recommendation: string }[] = [];
    const inventoryDelta = activeScenario.kpiResults.find(r => r.kpiId === 'inventory-turns')?.delta;
    const otifDelta = activeScenario.kpiResults.find(r => r.kpiId === 'otif')?.delta;
    if (inventoryDelta && inventoryDelta.high > 0 && otifDelta && otifDelta.low < 1) {
      results.push({
        dimension1: 'Inventory Reduction',
        dimension2: 'Service Level (OTIF)',
        tension: 'Aggressively reducing inventory may put service levels at risk during transition.',
        recommendation: 'Phase inventory reduction alongside demand planning improvements.',
      });
    }
    const logisticsDelta = activeScenario.kpiResults.find(r => r.kpiId === 'logistics-cost')?.delta;
    if (logisticsDelta && logisticsDelta.low < -0.5) {
      results.push({
        dimension1: 'Logistics Cost',
        dimension2: 'Delivery Speed',
        tension: 'Consolidation and network optimization may increase lead times.',
        recommendation: 'Segment logistics by service tier — optimize cost for standard, protect speed for priority.',
      });
    }
    return results;
  }, [activeScenario]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Benefit Simulation</h1>
        <p className="text-muted-foreground mt-1">
          Adjust maturity targets and see projected KPI and financial impact.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Maturity Sliders */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Target Maturity</CardTitle>
              <CardDescription>Adjust target maturity for each topic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Scenario Name</label>
                <Input
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="Name your scenario"
                />
              </div>
              {topics.map((topic) => {
                const targetVal = overrides[topic.id] ?? topic.currentMaturity;
                return (
                  <div key={topic.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium truncate pr-2">{topic.label}</span>
                      <span className="text-muted-foreground">
                        {topic.currentMaturity} → {targetVal} ({maturityLabel(targetVal)})
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={targetVal}
                      onChange={(e) =>
                        handleSliderChange(topic.id, Number(e.target.value))
                      }
                      showValue={false}
                    />
                  </div>
                );
              })}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={handleRun} className="flex-1">
                Run Simulation
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {activeScenario ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Projected KPI Impact — {activeScenario.name}
                      </CardTitle>
                      <CardDescription>Baseline vs projected range</CardDescription>
                    </div>
                    <Button size="sm" onClick={handleSave}>
                      Save Scenario
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="baseline" fill="hsl(215, 20%, 65%)" name="Baseline" />
                        <Bar dataKey="projectedLow" fill="hsl(221, 83%, 53%)" name="Projected (Low)" />
                        <Bar dataKey="projectedHigh" fill="hsl(142, 71%, 45%)" name="Projected (High)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No KPI changes detected. Try adjusting maturity levels above their
                      current values.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* KPI Detail Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">KPI Detail</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="pb-2 font-medium">KPI</th>
                          <th className="pb-2 font-medium text-right">Baseline</th>
                          <th className="pb-2 font-medium text-right">Projected (Low)</th>
                          <th className="pb-2 font-medium text-right">Projected (High)</th>
                          <th className="pb-2 font-medium text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeScenario.kpiResults.map((result) => {
                          const kpi = kpis.find((k) => k.id === result.kpiId);
                          return (
                            <tr key={result.kpiId} className="border-b">
                              <td className="py-2">{kpi?.label ?? result.kpiId}</td>
                              <td className="py-2 text-right font-mono">
                                {result.baselineValue.toFixed(1)}
                              </td>
                              <td className="py-2 text-right font-mono">
                                {result.projectedLow.toFixed(1)}
                              </td>
                              <td className="py-2 text-right font-mono">
                                {result.projectedHigh.toFixed(1)}
                              </td>
                              <td className="py-2 text-right font-mono">
                                <span
                                  className={
                                    result.delta.high > 0
                                      ? 'text-green-600'
                                      : result.delta.high < 0
                                      ? 'text-red-600'
                                      : ''
                                  }
                                >
                                  {result.delta.low >= 0 ? '+' : ''}
                                  {result.delta.low.toFixed(1)} to{' '}
                                  {result.delta.high >= 0 ? '+' : ''}
                                  {result.delta.high.toFixed(1)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Tradeoffs */}
              {tradeoffs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tradeoffs & Risks</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {tradeoffs.map((t, i) => (
                      <div key={i} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">
                          {t.dimension1} vs {t.dimension2}
                        </p>
                        <p className="text-muted-foreground mt-1">{t.tension}</p>
                        <p className="text-xs text-primary mt-1">
                          Recommendation: {t.recommendation}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <p className="text-muted-foreground">
                  Adjust maturity targets and click &quot;Run Simulation&quot; to see projected
                  benefits.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Saved Scenarios */}
          {simulationScenarios.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Saved Scenarios</CardTitle>
                <CardDescription>
                  Compare scenarios by reloading them
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulationScenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{scenario.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scenario.createdAt).toLocaleString()} ·{' '}
                        {Object.keys(scenario.topicOverrides).length} topics modified
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveScenario(scenario);
                          setOverrides(scenario.topicOverrides);
                          setScenarioName(scenario.name);
                        }}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteScenario(scenario.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
