'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAssessmentStore } from '@/store/assessment-store';
import { generateId } from '@/lib/utils';
import type { Industry, Region, RevenueBand } from '@/types/domain';

const schema = z.object({
  name: z.string().min(2, 'Company name is required'),
  industry: z.string().min(1, 'Select an industry'),
  region: z.string().min(1, 'Select a region'),
  revenueBand: z.string().min(1, 'Select a revenue band'),
  description: z.string().min(10, 'Provide a brief description (min 10 chars)'),
});

type FormData = z.infer<typeof schema>;

const industries: { value: Industry; label: string }[] = [
  { value: 'cpg', label: 'Consumer Packaged Goods (CPG)' },
  { value: 'pharma', label: 'Pharmaceuticals' },
  { value: 'industrial-manufacturing', label: 'Industrial Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'technology', label: 'Technology' },
  { value: 'other', label: 'Other' },
];

const regions: { value: Region; label: string }[] = [
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'middle-east-africa', label: 'Middle East & Africa' },
  { value: 'global', label: 'Global' },
];

const revenueBands: { value: RevenueBand; label: string }[] = [
  { value: 'under-500m', label: 'Under $500M' },
  { value: '500m-1b', label: '$500M – $1B' },
  { value: '1b-5b', label: '$1B – $5B' },
  { value: '5b-20b', label: '$5B – $20B' },
  { value: 'over-20b', label: 'Over $20B' },
];

export default function LandingPage() {
  const router = useRouter();
  const { createAssessment, assessment } = useAssessmentStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    createAssessment({
      id: generateId(),
      name: data.name,
      industry: data.industry as Industry,
      region: data.region as Region,
      revenueBand: data.revenueBand as RevenueBand,
      description: data.description,
      createdAt: new Date().toISOString(),
    });
    router.push('/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Value Chain Assessment</h1>
        <p className="text-muted-foreground">
          Enter client details below to generate a supply chain maturity assessment,
          insights, and improvement roadmap.
        </p>
      </div>

      {assessment && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Assessment: {assessment.clientProfile.name}</p>
                <p className="text-sm text-muted-foreground">
                  Status: {assessment.status} · {assessment.topics.length} topics ·{' '}
                  {assessment.insights.length} insights
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard')} variant="outline" size="sm">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Create New Assessment</CardTitle>
          <CardDescription>
            Provide client profile information to generate the initial assessment.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Company Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Acme Corporation"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="industry" className="text-sm font-medium">
                  Industry
                </label>
                <Select id="industry" {...register('industry')}>
                  <option value="">Select industry...</option>
                  {industries.map((i) => (
                    <option key={i.value} value={i.value}>
                      {i.label}
                    </option>
                  ))}
                </Select>
                {errors.industry && (
                  <p className="text-xs text-destructive">{errors.industry.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="region" className="text-sm font-medium">
                  Primary Region
                </label>
                <Select id="region" {...register('region')}>
                  <option value="">Select region...</option>
                  {regions.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
                {errors.region && (
                  <p className="text-xs text-destructive">{errors.region.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="revenueBand" className="text-sm font-medium">
                Revenue Band
              </label>
              <Select id="revenueBand" {...register('revenueBand')}>
                <option value="">Select revenue band...</option>
                {revenueBands.map((rb) => (
                  <option key={rb.value} value={rb.value}>
                    {rb.label}
                  </option>
                ))}
              </Select>
              {errors.revenueBand && (
                <p className="text-xs text-destructive">{errors.revenueBand.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Business Description
              </label>
              <Textarea
                id="description"
                placeholder="Brief overview of the client's business, products, markets, and supply chain highlights..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Generating...' : 'Generate Assessment'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
