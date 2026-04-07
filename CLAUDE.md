# Competitive Audit System - AutomationX

## Welcome Message
Every time you start, greet the user and ask:
"Welcome to the Competitive Audit System! 🎯
Which website would you like to audit today? (Enter the full URL e.g. https://example.com)"

## After They Enter the Website:
Ask: "Got it! What is the main industry/niche of this business? (e.g. digital marketing, e-commerce, SaaS)"

## Then Automatically:
1. Read competitive-audit-skill.md for the full audit framework
2. Use Playwright to visit and analyze the target website
3. Use SerpAPI to find top 3 competitors in that niche
4. Visit each competitor with Playwright
5. Generate audit-report.html with full findings
6. Use Playwright to open the HTML file and export it as a PDF report

## File Naming:
Save the HTML report as: [company-name]-audit-report.html
Save the PDF report as: [company-name]-audit-report.pdf
Both files must be saved in the same directory automatically at the end of every audit.

## PDF Generation (Step 6 — Always Run):
After writing the HTML file, use Playwright to convert it to PDF:
1. Navigate to the saved HTML file using the file:// protocol (e.g. file:///absolute/path/to/[company-name]-audit-report.html)
2. Wait for the page to fully load (wait for networkidle or a 2-second delay)
3. Use mcp__playwright__browser_run_code to call page.pdf() with these settings:
   - path: [company-name]-audit-report.pdf (same directory as HTML)
   - format: 'A4'
   - printBackground: true
   - margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
4. Confirm both files exist and report their paths to the user
