'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import type { ValidationQuestion } from '@/types/domain';

interface QuestionFormProps {
  question: ValidationQuestion;
  onAnswer: (questionId: string, answer: string | number | boolean) => void;
}

export function QuestionForm({ question, onAnswer }: QuestionFormProps) {
  const [value, setValue] = useState<string | number | boolean>(question.answer ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value !== '' && value !== undefined) {
      onAnswer(question.id, value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">{question.questionText}</p>
        <Badge variant="outline" className="shrink-0 text-xs">
          {question.category}
        </Badge>
      </div>

      {question.targetStakeholder && (
        <p className="text-xs text-muted-foreground">
          Target: <span className="font-medium">{question.targetStakeholder}</span>
        </p>
      )}

      <div className="pt-1">
        {question.answerType === 'yes-no' && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant={value === true ? 'default' : 'outline'}
              size="sm"
              onClick={() => setValue(true)}
            >
              Yes
            </Button>
            <Button
              type="button"
              variant={value === false ? 'default' : 'outline'}
              size="sm"
              onClick={() => setValue(false)}
            >
              No
            </Button>
          </div>
        )}

        {question.answerType === 'select-one' && question.options && (
          <div className="flex flex-wrap gap-2">
            {question.options.map((opt) => (
              <Button
                key={opt}
                type="button"
                variant={value === opt ? 'default' : 'outline'}
                size="sm"
                onClick={() => setValue(opt)}
              >
                {opt}
              </Button>
            ))}
          </div>
        )}

        {question.answerType === 'numeric' && (
          <Input
            type="number"
            value={value as number}
            onChange={(e) => setValue(Number(e.target.value))}
            placeholder="Enter a number..."
          />
        )}

        {question.answerType === 'slider' && (
          <Slider
            min={1}
            max={5}
            step={1}
            value={typeof value === 'number' ? value : 3}
            onChange={(e) => setValue(Number(e.target.value))}
            label="Rating"
          />
        )}

        {question.answerType === 'free-text' && (
          <Textarea
            value={value as string}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer..."
            rows={3}
          />
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-muted-foreground">
          Impact: confirm +{question.impactMapping.confirmDelta.toFixed(2)} / contradict{' '}
          {question.impactMapping.contradictDelta.toFixed(2)}
        </p>
        <Button type="submit" size="sm" disabled={value === '' || value === undefined}>
          Submit Answer
        </Button>
      </div>

      {question.answer !== undefined && (
        <p className="text-xs text-green-600 font-medium">
          Answered: {String(question.answer)}
          {question.answeredAt && ` at ${new Date(question.answeredAt).toLocaleString()}`}
        </p>
      )}
    </form>
  );
}
