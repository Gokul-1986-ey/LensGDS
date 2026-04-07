'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuditStore } from '@/store/audit-store';

const schema = z.object({
  targetUrl: z.string().url('Enter a valid URL (e.g. https://example.com)'),
  industry: z.string().min(2, 'Enter the industry or niche'),
});

type FormData = z.infer<typeof schema>;

export default function AuditPage() {
  const router = useRouter();
  const { status, progress, report, htmlContent, startAudit, setReport, setError, addProgress, setStatus, clearAudit } = useAuditStore();
  const [isRunning, setIsRunning] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { targetUrl: '', industry: '' },
  });

  const onSubmit = async (data: FormData) => {
    setIsRunning(true);
    startAudit({ targetUrl: data.targetUrl, industry: data.industry });

    try {
      addProgress('Sending audit request to API...');
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({ error: 'Audit failed' }));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      addProgress('Audit complete — report generated.');
      setReport(result.report, result.html);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!htmlContent || !report) return;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.targetCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!htmlContent || !report) return;
    try {
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: htmlContent, companyName: report.targetCompany.name }),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.targetCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('PDF export requires Playwright to be installed on the server. HTML download is always available.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Competitive Audit</h1>
        <p className="text-muted-foreground mt-1">
          Enter a target website and industry to generate a full supply chain competitive intelligence report.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Audit</CardTitle>
          <CardDescription>
            The system will analyze the target website, find top competitors, and generate a comprehensive report.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Website URL</label>
              <Input
                placeholder="https://flex.com"
                {...register('targetUrl')}
                disabled={isRunning}
              />
              {errors.targetUrl && (
                <p className="text-sm text-destructive">{errors.targetUrl.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry / Niche</label>
              <Input
                placeholder="e.g. Electronics Manufacturing Services, SaaS, Logistics"
                {...register('industry')}
                disabled={isRunning}
              />
              {errors.industry && (
                <p className="text-sm text-destructive">{errors.industry.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex gap-3">
            <Button type="submit" disabled={isRunning}>
              {isRunning ? 'Running Audit...' : 'Run Competitive Audit'}
            </Button>
            {status === 'complete' && (
              <Button type="button" variant="outline" onClick={clearAudit}>
                New Audit
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      {/* Progress Log */}
      {progress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Audit Progress
              <Badge variant={status === 'complete' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
                {status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm">
              {progress.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground select-none">{String(i + 1).padStart(2, '0')}.</span>
                  <span>{msg}</span>
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="animate-pulse">●</span> Processing...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Actions */}
      {status === 'complete' && report && (
        <Card>
          <CardHeader>
            <CardTitle>Report Ready: {report.targetCompany.name}</CardTitle>
            <CardDescription>
              {report.competitors.length} competitors analyzed &middot; {report.gaps.length} gaps identified &middot; {report.recommendations.length} recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {report.execKpis.map((kpi, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    kpi.color === 'success'
                      ? 'border-t-2 border-t-green-500'
                      : kpi.color === 'danger'
                      ? 'border-t-2 border-t-red-500'
                      : kpi.color === 'warn'
                      ? 'border-t-2 border-t-yellow-500'
                      : 'border-t-2 border-t-blue-500'
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sublabel}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={handleDownloadHtml}>
                Download HTML Report
              </Button>
              <Button variant="outline" onClick={handleDownloadPdf}>
                Download PDF Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (htmlContent) {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(htmlContent);
                      win.document.close();
                    }
                  }
                }}
              >
                Preview in Browser
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Audit failed: {useAuditStore.getState().error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
