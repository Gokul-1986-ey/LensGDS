import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/export/pdf
 * Accepts { html, companyName } and returns a PDF blob.
 *
 * Uses @sparticuz/chromium on Vercel/serverless, falls back to local Playwright chromium in dev.
 */
export async function POST(request: NextRequest) {
  try {
    const { html, companyName } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'html content is required' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let browser: any;

    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (isVercel) {
      // Serverless path — uses @sparticuz/chromium (smaller, lambda-compatible)
      try {
        const [chromium, { chromium: playwrightChromium }] = await Promise.all([
          import('@sparticuz/chromium'),
          import('playwright-core'),
        ]);
        browser = await playwrightChromium.launch({
          args: chromium.default.args,
          executablePath: await chromium.default.executablePath(),
          headless: true,
        });
      } catch {
        return NextResponse.json(
          { error: 'PDF generation unavailable in this environment.' },
          { status: 501 }
        );
      }
    } else {
      // Local dev path — uses full Playwright
      try {
        const pw = await import('playwright');
        browser = await pw.chromium.launch({ headless: true });
      } catch {
        return NextResponse.json(
          { error: 'Playwright not installed. Run: npm install playwright && npx playwright install chromium' },
          { status: 501 }
        );
      }
    }

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    });

    await browser.close();

    const fileName = companyName
      ? `${companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-audit-report.pdf`
      : 'audit-report.pdf';

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
