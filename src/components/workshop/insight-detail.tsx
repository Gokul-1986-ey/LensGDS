'use client';

import { Badge } from '@/components/ui/badge';
import { cn, confidenceColor } from '@/lib/utils';
import type { Insight } from '@/types/domain';

interface InsightDetailProps {
  insight: Insight;
  className?: string;
}

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  critical: 'destructive',
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

export function InsightDetail({ insight, className }: InsightDetailProps) {
  return (
    <div className={cn('rounded-lg border p-4 space-y-3', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">{insight.claim}</p>
          <div className="flex gap-2 mt-1">
            <Badge variant={severityVariant[insight.severity]}>{insight.severity}</Badge>
            <Badge variant="outline">{insight.category}</Badge>
          </div>
        </div>
        <div className={cn('text-sm font-mono', confidenceColor(insight.confidence))}>
          {Math.round(insight.confidence * 100)}%
        </div>
      </div>

      {insight.evidence.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Evidence</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {insight.evidence.map((e, i) => (
              <li key={i} className="flex gap-1">
                <span className="shrink-0">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight.assumptions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Assumptions</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            {insight.assumptions.map((a, i) => (
              <li key={i} className="flex gap-1">
                <span className="shrink-0">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight.financialImpactEstimate && (
        <p className="text-xs">
          <span className="font-medium">Est. Impact:</span>{' '}
          <span className="text-primary">{insight.financialImpactEstimate}</span>
        </p>
      )}

      {insight.needsValidation && (
        <p className="text-xs text-yellow-600 font-medium">
          ⚠ Needs validation ({insight.validationQuestions.length} questions)
        </p>
      )}
    </div>
  );
}
