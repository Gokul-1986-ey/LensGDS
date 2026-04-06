'use client';

import { cn, maturityLabel, maturityColor } from '@/lib/utils';
import type { AssessmentTopic } from '@/types/domain';

interface MaturityHeatmapProps {
  topics: AssessmentTopic[];
  className?: string;
}

export function MaturityHeatmap({ topics, className }: MaturityHeatmapProps) {
  const categories = [...new Set(topics.map((t) => t.category))];

  return (
    <div className={cn('space-y-4', className)}>
      {categories.map((cat) => (
        <div key={cat}>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2 capitalize">{cat}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {topics
              .filter((t) => t.category === cat)
              .map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{topic.label}</p>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {Math.round(topic.confidence * 100)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold',
                        maturityColor(topic.currentMaturity)
                      )}
                    >
                      {topic.currentMaturity}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {maturityLabel(topic.currentMaturity)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
