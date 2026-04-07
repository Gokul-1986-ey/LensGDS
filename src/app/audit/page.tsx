'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuditStore } from '@/store/audit-store';

const schema = z.object({
  targetUrl: z.string().url('Enter a valid URL (e.g. https://pepsico.com)'),
  industry: z.string().min(2, 'Enter the industry or niche'),
});

type FormData = z.infer<typeof schema>;

const EXAMPLE_AUDITS = [
  { url: 'https://pepsico.com',      industry: 'Consumer Packaged Goods' },
  { url: 'https://flex.com',         industry: 'Electronics Manufacturing Services' },
  { url: 'https://suncor.com',       industry: 'Oil & Gas / Energy' },
  { url: 'https://unilever.com',     industry: 'Consumer Packaged Goods' },
  { url: 'https://jnj.com',          industry: 'Healthcare / Pharmaceuticals' },
  { url: 'https://ford.com',         industry: 'Automotive Manufacturing' },
];

export default function AuditPage() {
  const {
    status, progress, report, htmlContent,
    startAudit, setReport, setError, addProgress, clearAudit,
  } = useAuditStore();

  const [isRunning, setIsRunning] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { targetUrl: '', industry: '' },
  });

  // ── Run audit via SSE stream ──────────────────────────────
  const onSubmit = async (data: FormData) => {
    setIsRunning(true);
    startAudit({ targetUrl: data.targetUrl, industry: data.industry });

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok || !response.body) {
        const err = await response.json().catch(() => ({ error: 'Audit request failed' }));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';   // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              addProgress(event.message as string);
            } else if (event.type === 'complete') {
              addProgress('✅ Report generated successfully.');
              setReport(event.report, event.html as string);
            } else if (event.type === 'error') {
              throw new Error(event.message as string);
            }
          } catch (parseErr) {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // ── Export helpers ────────────────────────────────────────
  const downloadHtml = () => {
    if (!htmlContent || !report) return;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.targetCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-report.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
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
      alert('PDF export requires Playwright. Run: npm install playwright && npx playwright install chromium\n\nHTML download always works.');
    }
  };

  const previewInBrowser = () => {
    if (!htmlContent) return;
    const win = window.open('', '_blank');
    if (win) { win.document.open(); win.document.write(htmlContent); win.document.close(); }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Competitive Audit</h1>
        <p className="text-muted-foreground mt-1">
          AI-powered supply chain competitive intelligence — Plan → Source → Make → Deliver → Return.
          Generates a McKinsey-quality report with real company data, benchmarks, and recommendations.
        </p>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start New Audit</CardTitle>
          <CardDescription>
            Enter a company URL and industry. Claude will analyse the company, identify competitors,
            benchmark supply chain KPIs, and generate a full C-suite report.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Company Website URL</label>
              <Input
                placeholder="https://pepsico.com"
                {...register('targetUrl')}
                disabled={isRunning}
              />
              {errors.targetUrl && (
                <p className="text-sm text-destructive">{errors.targetUrl.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry / Sector</label>
              <Input
                placeholder="e.g. Consumer Packaged Goods, Electronics Manufacturing Services, Oil & Gas"
                {...register('industry')}
                disabled={isRunning}
              />
              {errors.industry && (
                <p className="text-sm text-destructive">{errors.industry.message}</p>
              )}
            </div>

            {/* Example quick-fill buttons */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Quick examples:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_AUDITS.map((ex) => (
                  <button
                    key={ex.url}
                    type="button"
                    disabled={isRunning}
                    onClick={() => {
                      setValue('targetUrl', ex.url);
                      setValue('industry', ex.industry);
                    }}
                    className="text-xs border rounded-md px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-40"
                  >
                    {ex.url.replace('https://', '')}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex gap-3">
            <Button type="submit" disabled={isRunning}>
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span> Generating Audit...
                </span>
              ) : 'Run Competitive Audit'}
            </Button>
            {(status === 'complete' || status === 'error') && (
              <Button type="button" variant="outline" onClick={clearAudit} disabled={isRunning}>
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
            <CardTitle className="flex items-center gap-3 text-base">
              Audit Progress
              <Badge variant={
                status === 'complete' ? 'default'
                : status === 'error' ? 'destructive'
                : 'secondary'
              }>
                {status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 font-mono text-sm max-h-64 overflow-y-auto">
              {progress.map((msg, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground select-none shrink-0">
                    {String(i + 1).padStart(2, '0')}.
                  </span>
                  <span>{msg}</span>
                </div>
              ))}
              {isRunning && (
                <div className="flex items-center gap-2 text-muted-foreground pt-1">
                  <span className="animate-pulse">●</span>
                  <span>Claude is thinking...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {status === 'error' && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium text-sm">
              ⚠ Audit failed: {useAuditStore.getState().error}
            </p>
            <p className="text-muted-foreground text-xs mt-2">
              Make sure ANTHROPIC_API_KEY is set in .env.local and restart the dev server.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Ready */}
      {status === 'complete' && report && (
        <Card>
          <CardHeader>
            <CardTitle>Report Ready: {report.targetCompany.name}</CardTitle>
            <CardDescription>
              {report.competitors.length} competitors analysed · {report.gaps.length} supply chain gaps identified · {report.recommendations.length} strategic recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Executive KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {report.execKpis.map((kpi, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-4 ${
                    kpi.color === 'success' ? 'border-t-2 border-t-green-500'
                    : kpi.color === 'danger' ? 'border-t-2 border-t-red-500'
                    : kpi.color === 'warn' ? 'border-t-2 border-t-yellow-500'
                    : 'border-t-2 border-t-blue-500'
                  }`}
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sublabel}</p>
                </div>
              ))}
            </div>

            {/* Strategic narrative */}
            {report.strategicNarrative && (
              <div className="rounded-lg bg-muted/50 border p-4 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: report.strategicNarrative }}
              />
            )}

            {/* Competitors chips */}
            {report.competitors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Competitors Analysed</p>
                <div className="flex flex-wrap gap-2">
                  {report.competitors.map((c) => (
                    <Badge key={c.shortName} variant="outline">{c.name}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Value chain summary */}
            {report.valueChain.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Value Chain Status</p>
                <div className="flex gap-2 flex-wrap">
                  {report.valueChain.map((step) => (
                    <span
                      key={step.phase}
                      className={`text-xs px-3 py-1.5 rounded-md font-medium ${
                        step.status === 'strong' ? 'bg-green-100 text-green-800'
                        : step.status === 'gap' ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {step.phase.toUpperCase()} · {step.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Export actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={downloadHtml}>
                ⬇ Download HTML Report
              </Button>
              <Button variant="outline" onClick={downloadPdf}>
                ⬇ Download PDF Report
              </Button>
              <Button variant="outline" onClick={previewInBrowser}>
                ↗ Preview in New Tab
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works — shown when idle */}
      {status === 'idle' && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-3">How it works</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">1. You provide a URL</p>
                <p>Enter any company website and its industry sector. Use the quick-fill examples to get started instantly.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">2. Claude analyses</p>
                <p>Claude Opus analyses the company's supply chain across Plan → Source → Make → Deliver → Return, finds 3 real competitors, and benchmarks financials & working capital.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">3. You get a C-suite report</p>
                <p>A McKinsey-quality HTML/PDF report with charts, gap analysis, and 7 strategic recommendations — ready to share with your CSCO, COO, or CXO.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
