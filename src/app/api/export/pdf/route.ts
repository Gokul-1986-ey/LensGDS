import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/export/pdf
 * Accepts { html, companyName } and returns a PDF blob.
 *
 * Requires Playwright to be installed:
 *   npm install playwright
 *
 * Falls back to an error message if Playwright is not available.
 */
export async function POST(request: NextRequest) {
  try {
    const { html, companyName } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'html content is required' }, { status: 400 });
    }

    // Dynamic import — only loads Playwright if installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let chromium: any;
    try {
      const moduleName = 'playwright';
      const pw = await (Function('m', 'return import(m)')(moduleName));
      chromium = pw.chromium;
    } catch {
      return NextResponse.json(
        { error: 'Playwright is not installed. Run: npm install playwright && npx playwright install chromium' },
        { status: 501 }
      );
    }

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Load HTML content directly
    await page.setContent(html, { waitUntil: 'networkidle' });

    // Generate PDF matching CLAUDE.md spec
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '15mm',
        left: '12mm',
        right: '12mm',
      },
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
