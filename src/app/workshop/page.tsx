'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAssessmentStore } from '@/store/assessment-store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InsightDetail } from '@/components/workshop/insight-detail';
import { QuestionForm } from '@/components/workshop/question-form';
import { confidenceColor } from '@/lib/utils';

export default function WorkshopPage() {
  const router = useRouter();
  const assessment = useAssessmentStore((s) => s.assessment);
  const answerQuestion = useAssessmentStore((s) => s.answerQuestion);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);

  if (!assessment) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-bold">No Assessment Found</h2>
        <p className="text-muted-foreground">Create an assessment first.</p>
        <Button onClick={() => router.push('/')}>Create Assessment</Button>
      </div>
    );
  }

  const { insights, validationLog } = assessment;
  const selectedInsight = insights.find((i) => i.id === selectedInsightId);
  const unansweredCount = insights.reduce(
    (sum, i) => sum + i.validationQuestions.filter((q) => q.answer === undefined).length,
    0
  );
  const answeredCount = validationLog.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Validation Workshop</h1>
          <p className="text-muted-foreground mt-1">
            Drill into insights, answer validation questions, and watch confidence update in
            real time.
          </p>
        </div>
        <div className="text-right text-sm">
          <p>
            <span className="font-medium">{answeredCount}</span> answered ·{' '}
            <span className="font-medium">{unansweredCount}</span> remaining
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Insight List */}
        <div className="lg:col-span-1 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Insights</CardTitle>
              <CardDescription>
                Click an insight to see its validation questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {insights
                .sort((a, b) => {
                  const order = { critical: 0, high: 1, medium: 2, low: 3 };
                  return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
                })
                .map((insight) => {
                  const unanswered = insight.validationQuestions.filter(
                    (q) => q.answer === undefined
                  ).length;
                  return (
                    <button
                      key={insight.id}
                      onClick={() => setSelectedInsightId(insight.id)}
                      className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                        selectedInsightId === insight.id
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium line-clamp-2">{insight.claim}</span>
                        <span className={`shrink-0 text-xs font-mono ${confidenceColor(insight.confidence)}`}>
                          {Math.round(insight.confidence * 100)}%
                        </span>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <Badge
                          variant={
                            insight.severity === 'critical'
                              ? 'destructive'
                              : insight.severity === 'high'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {insight.severity}
                        </Badge>
                        {unanswered > 0 && (
                          <Badge variant="outline" className="text-[10px]">
                            {unanswered} unanswered
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
            </CardContent>
          </Card>
        </div>

        {/* Detail + Questions */}
        <div className="lg:col-span-2 space-y-4">
          {selectedInsight ? (
            <>
              <InsightDetail insight={selectedInsight} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Validation Questions</CardTitle>
                  <CardDescription>
                    {selectedInsight.validationQuestions.length} questions for this insight
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedInsight.validationQuestions.map((question) => (
                    <QuestionForm
                      key={question.id}
                      question={question}
                      onAnswer={answerQuestion}
                    />
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <p className="text-muted-foreground">
                  Select an insight from the list to view its details and validation questions.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Change Log */}
      {validationLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change Log</CardTitle>
            <CardDescription>Recent confidence updates from answered questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {validationLog
                .slice()
                .reverse()
                .slice(0, 20)
                .map((entry) => {
                  const insight = insights.find((i) => i.id === entry.insightId);
                  return (
                    <div key={entry.id} className="flex items-center justify-between text-xs border-b pb-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          {insight?.claim?.slice(0, 80) ?? entry.insightId}
                        </p>
                        <p className="text-muted-foreground">
                          Answer: {String(entry.answer)}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className={confidenceColor(entry.previousConfidence)}>
                          {Math.round(entry.previousConfidence * 100)}%
                        </span>
                        {' → '}
                        <span className={confidenceColor(entry.newConfidence)}>
                          {Math.round(entry.newConfidence * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
