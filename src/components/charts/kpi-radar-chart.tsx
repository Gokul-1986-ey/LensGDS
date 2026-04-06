'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { KPI } from '@/types/domain';

interface KpiRadarChartProps {
  kpis: KPI[];
  className?: string;
}

export function KpiRadarChart({ kpis, className }: KpiRadarChartProps) {
  const data = kpis.map((kpi) => ({
    label: kpi.label,
    baseline: kpi.baselineValue,
    target: kpi.targetValue ?? kpi.baselineValue,
    benchmark: kpi.industryBenchmark ?? kpi.baselineValue,
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="label" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name="Current"
            dataKey="baseline"
            stroke="hsl(221, 83%, 53%)"
            fill="hsl(221, 83%, 53%)"
            fillOpacity={0.2}
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="hsl(142, 71%, 45%)"
            fill="hsl(142, 71%, 45%)"
            fillOpacity={0.1}
          />
          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="hsl(0, 0%, 60%)"
            fill="none"
            strokeDasharray="5 5"
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
