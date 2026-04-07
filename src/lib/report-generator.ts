import type { AuditReport } from '@/types/audit';

/**
 * Generates a self-contained HTML audit report matching the AutomationX format.
 * The output is a single HTML file with embedded CSS, Chart.js via CDN, and inline JS.
 */
export function generateAuditReportHtml(report: AuditReport): string {
  const {
    targetCompany,
    industry,
    reportDate,
    competitors,
    execKpis,
    strategicNarrative,
    riskOpportunities,
    scServices,
    industriesServed,
    strategyStats,
    valueChain,
    industryOverview,
    financials,
    workingCapital,
    comparisonTable,
    gaps,
    recommendations,
    quickWins,
  } = report;

  const compNames = competitors.map((c) => c.name).join(' &middot; ');
  const quickWinRecs = recommendations.filter((r) => r.horizon === 'quick-win');
  const midTermRecs = recommendations.filter((r) => r.horizon === 'mid-term');
  const strategicRecs = recommendations.filter((r) => r.horizon === 'strategic');

  // Best-in-class peer for WC benchmarking
  const bestC2CPeer = [...competitors].sort((a, b) => a.workingCapital.c2c - b.workingCapital.c2c)[0];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Supply Chain Competitive Audit &mdash; ${esc(targetCompany.name)} | ${esc(reportDate)}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
<style>
${CSS_STYLES}
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-badge">Supply Chain Competitive Intelligence Report</div>
  <h1>${esc(targetCompany.name)} <span>Supply Chain Audit</span><br/>${esc(industry)}</h1>
  <div class="cover-sub">End-to-End Supply Chain Benchmarking: Plan &middot; Source &middot; Make &middot; Deliver &middot; Return</div>
  <div class="cover-audience">Prepared for: CSCO &middot; COO &middot; CXO Audience</div>
  <div class="cover-meta">
    <div class="cover-meta-item"><label>Target Website</label><span>${esc(targetCompany.website)}</span></div>
    <div class="cover-meta-item"><label>Industry</label><span>${esc(industry)}</span></div>
    <div class="cover-meta-item"><label>Competitors</label><span>${compNames}</span></div>
    <div class="cover-meta-item"><label>Report Date</label><span>${esc(reportDate)}</span></div>
    <div class="cover-meta-item"><label>Prepared by</label><span>AutomationX Audit System</span></div>
  </div>
</div>

<div class="container">

<!-- SECTION 01: EXECUTIVE SUMMARY -->
<div class="section">
  <div class="section-tag">Section 01</div>
  <div class="section-title">Executive Summary</div>
  <div class="section-sub">Supply chain performance snapshot and strategic context for ${esc(targetCompany.name)}'s competitive position across the value chain.</div>

  <div class="exec-grid">
    ${execKpis.map((kpi) => `<div class="exec-card ${kpi.color}">
      <div class="label">${esc(kpi.label)}</div>
      <div class="value">${esc(kpi.value)}</div>
      <div class="sublabel">${esc(kpi.sublabel)}</div>
    </div>`).join('\n    ')}
  </div>

  <div class="summary-box">
    <h3>Strategic Assessment &mdash; Supply Chain Lens</h3>
    <p>${strategicNarrative}</p>
  </div>

  <div class="risk-opps">
    <div class="risk-box">
      <h4 class="red">Strategic Risks</h4>
      <ul class="red">
        ${riskOpportunities.risks.map((r) => `<li>${esc(r)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="risk-box">
      <h4 class="green">Growth Opportunities</h4>
      <ul class="green">
        ${riskOpportunities.opportunities.map((o) => `<li>${esc(o)}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>
</div>

<!-- SECTION 02: COMPANY OVERVIEW -->
<div class="section">
  <div class="section-tag">Section 02</div>
  <div class="section-title">Target Company: ${esc(targetCompany.name)}</div>
  <div class="section-sub">Business model, supply chain capabilities, and market footprint &mdash; based on live website analysis conducted ${esc(reportDate)}.</div>

  <div class="overview-grid">
    <div class="overview-card">
      <h4>Company Profile</h4>
      ${profileRow('Founded', targetCompany.founded)}
      ${profileRow('HQ', targetCompany.hq)}
      ${profileRow('CEO', targetCompany.ceo)}
      ${profileRow('Ticker', targetCompany.ticker)}
      ${profileRow('Employees', targetCompany.employees)}
      ${profileRow('Facilities', targetCompany.facilities)}
      ${profileRow('Supply Chain Professionals', targetCompany.scProfessionals)}
      ${profileRow('Global Supplier Network', targetCompany.supplierNetwork)}
      ${profileRow('Annual Purchasing Spend', targetCompany.purchasingSpend)}
      ${profileRow('Business Model', targetCompany.businessModel)}
    </div>

    <div class="overview-card">
      <h4>Supply Chain Services Portfolio</h4>
      <div class="tag-list">
        ${scServices.map((s) => `<span class="tag ${s.color}">${esc(s.text)}</span>`).join('\n        ')}
      </div>
    </div>

    <div class="overview-card">
      <h4>Industries Served</h4>
      <div class="tag-list">
        ${industriesServed.map((i) => `<span class="tag blue">${esc(i)}</span>`).join('\n        ')}
      </div>
    </div>

    <div class="overview-card">
      <h4>SC Strategy &amp; Key Partnerships</h4>
      ${strategyStats.map((s) => `<div class="stat-row"><span>${esc(s.label)}</span><span class="val">${esc(s.value)}</span></div>`).join('\n      ')}
    </div>
  </div>
</div>

<!-- SECTION 03: INDUSTRY & VALUE CHAIN -->
<div class="section">
  <div class="section-tag">Section 03</div>
  <div class="section-title">Industry Overview &amp; Supply Chain Value Chain</div>
  <div class="section-sub">Market structure, margin pools, and supply chain disruptions. Mapped across Plan &rarr; Source &rarr; Make &rarr; Deliver &rarr; Return.</div>

  <div class="vc-container">
    <h4>${esc(targetCompany.name)} Supply Chain Footprint &mdash; Plan &rarr; Source &rarr; Make &rarr; Deliver &rarr; Return</h4>
    <div class="value-chain">
      ${valueChain.map((step) => `<div class="vc-step ${step.status}">
        <div class="vc-label">${esc(step.phase)}</div>
        <div class="vc-name">${esc(step.name)}</div>
        <div class="vc-bullets">${step.bullets.map((b) => '&bull; ' + esc(b)).join('<br>')}</div>
      </div>`).join('\n      ')}
    </div>
    <div class="vc-legend">
      <span><span class="vc-dot" style="background:var(--blue)"></span> Strong Capability</span>
      <span><span class="vc-dot" style="background:var(--navy2)"></span> Developing</span>
      <span><span class="vc-dot" style="background:#7f1d1d"></span> Gap / Weakness</span>
    </div>
  </div>

  <div class="overview-grid">
    <div class="overview-card">
      <h4>Industry Landscape</h4>
      ${industryOverview.stats.map((s) => `<div class="stat-row"><span>${esc(s.label)}</span><span class="val">${esc(s.value)}</span></div>`).join('\n      ')}
    </div>
    <div class="overview-card">
      <h4>Key Supply Chain Disruptions &amp; Trends</h4>
      <div class="tag-list">
        ${industryOverview.trends.map((t) => `<span class="tag ${t.color}">${esc(t.text)}</span>`).join('\n        ')}
      </div>
    </div>
  </div>
</div>

<!-- SECTION 04: FINANCIAL ANALYSIS -->
<div class="section">
  <div class="section-tag">Section 04</div>
  <div class="section-title">Financial Analysis &mdash; ${esc(targetCompany.name)}</div>
  <div class="section-sub">Multi-year revenue, COGS, gross margin, and working capital metrics.</div>

  <div class="fin-kpi-grid">
    ${financials.map((fy, i) => {
      const cls = fy.yoyGrowthPct !== undefined ? (fy.yoyGrowthPct > 0 ? 'up' : fy.yoyGrowthPct < 0 ? 'down' : '') : '';
      const growthNote = fy.yoyGrowthPct !== undefined ? `${fy.yoyGrowthPct > 0 ? '+' : ''}${fy.yoyGrowthPct.toFixed(1)}% YoY | ` : '';
      return `<div class="fin-kpi ${cls}">
      <div class="fk-label">${esc(fy.label)} Revenue</div>
      <div class="fk-value">$${fy.revenue.toFixed(1)}B</div>
      <div class="fk-sub">${growthNote}COGS: ~$${fy.cogs.toFixed(1)}B | GM: ${fy.grossMarginPct.toFixed(1)}%</div>
    </div>`;
    }).join('\n    ')}
  </div>

  <div class="charts-grid">
    <div class="chart-box">
      <h4>Revenue vs. COGS (USD Billions)</h4>
      <div class="chart-sub">Gross margin trend across reporting periods</div>
      <canvas id="revCOGSChart" height="220"></canvas>
    </div>
    <div class="chart-box">
      <h4>Gross Margin % Trend vs. Peers</h4>
      <div class="chart-sub">Margin comparison across all analyzed companies</div>
      <canvas id="gmTrendChart" height="220"></canvas>
    </div>
  </div>

  <div style="margin-top:28px;">
    <div class="section-tag" style="margin-bottom:8px;">Working Capital Metrics</div>
    <div class="section-title" style="font-size:20px;margin-bottom:8px;">${esc(targetCompany.name)} Working Capital Dashboard</div>
    <p style="color:var(--muted);font-size:14px;margin-bottom:20px;">C2C = DSO + DIO &minus; DPO.</p>

    <div class="wc-grid">
      <div class="wc-card ${workingCapital.dso > (bestC2CPeer?.workingCapital.dso ?? 999) + 5 ? 'warn' : 'success'}">
        <div class="wc-label">DSO &mdash; Days Sales Outstanding</div>
        <div class="wc-value">${workingCapital.dso}</div>
        <div class="wc-unit">days</div>
        <div class="wc-vs ${workingCapital.dso > (bestC2CPeer?.workingCapital.dso ?? 999) + 5 ? 'bad' : 'neutral'}">${bestC2CPeer ? esc(bestC2CPeer.shortName) + ': ' + bestC2CPeer.workingCapital.dso + ' days' : ''}</div>
      </div>
      <div class="wc-card ${workingCapital.dio > (bestC2CPeer?.workingCapital.dio ?? 999) + 10 ? 'danger' : 'warn'}">
        <div class="wc-label">DIO &mdash; Days Inventory Outstanding</div>
        <div class="wc-value">${workingCapital.dio}</div>
        <div class="wc-unit">days</div>
        <div class="wc-vs ${workingCapital.dio > (bestC2CPeer?.workingCapital.dio ?? 999) + 10 ? 'bad' : 'neutral'}">${bestC2CPeer ? esc(bestC2CPeer.shortName) + ': ' + bestC2CPeer.workingCapital.dio + ' days' : ''}</div>
      </div>
      <div class="wc-card ${workingCapital.dpo < (bestC2CPeer?.workingCapital.dpo ?? 0) - 10 ? 'warn' : 'success'}">
        <div class="wc-label">DPO &mdash; Days Payable Outstanding</div>
        <div class="wc-value">${workingCapital.dpo}</div>
        <div class="wc-unit">days</div>
        <div class="wc-vs ${workingCapital.dpo < (bestC2CPeer?.workingCapital.dpo ?? 0) - 10 ? 'bad' : 'good'}">${bestC2CPeer ? esc(bestC2CPeer.shortName) + ': ' + bestC2CPeer.workingCapital.dpo + ' days' : ''}</div>
      </div>
      <div class="wc-card ${workingCapital.c2c > 50 ? 'danger' : workingCapital.c2c > 30 ? 'warn' : 'success'}">
        <div class="wc-label">Cash-to-Cash Cycle</div>
        <div class="wc-value">${workingCapital.c2c}</div>
        <div class="wc-unit">days (DSO+DIO&minus;DPO)</div>
        <div class="wc-vs ${workingCapital.c2c > (bestC2CPeer?.workingCapital.c2c ?? 999) + 20 ? 'bad' : 'neutral'}">${bestC2CPeer ? esc(bestC2CPeer.shortName) + ': ' + bestC2CPeer.workingCapital.c2c + ' days' : ''}</div>
      </div>
    </div>

    <div class="charts-grid" style="margin-top:4px;">
      <div class="chart-box">
        <h4>Cash-to-Cash Cycle Comparison (Days)</h4>
        <div class="chart-sub">Lower = better &mdash; cash released faster</div>
        <canvas id="c2cChart" height="200"></canvas>
      </div>
      <div class="chart-box">
        <h4>DSO / DIO / DPO Breakdown by Company</h4>
        <div class="chart-sub">Working capital component comparison</div>
        <canvas id="dsodiodpoChart" height="200"></canvas>
      </div>
    </div>
  </div>
</div>

<!-- SECTION 05: COMPETITOR DEEP DIVES -->
<div class="section">
  <div class="section-tag">Section 05</div>
  <div class="section-title">Competitor Deep Dives &mdash; Supply Chain Focus</div>
  <div class="section-sub">Analysis of top ${competitors.length} competitors through a supply chain lens.</div>

  ${competitors.map((comp) => `<div class="comp-card">
    <div class="comp-header">
      <div class="comp-header-left">
        <div class="comp-icon" style="background:linear-gradient(135deg,${comp.colorFrom},${comp.colorTo})">${esc(comp.name.charAt(0))}</div>
        <div>
          <div class="comp-name">${esc(comp.name)}</div>
          <div class="comp-tagline">${esc(comp.tagline)}</div>
        </div>
      </div>
      <div class="comp-badge">${comp.kpiHighlights.map((k) => esc(k.label) + ': ' + esc(k.value)).join(' &middot; ')}</div>
    </div>
    <div class="comp-kpis">
      ${comp.kpiHighlights.map((k) => `<div class="comp-kpi"><div class="ck-label">${esc(k.label)}</div><div class="ck-value">${esc(k.value)}</div><div class="ck-sub">${esc(k.sub)}</div></div>`).join('\n      ')}
    </div>
    <div class="comp-body">
      <div class="comp-col">
        <h5>SC Strengths vs. ${esc(targetCompany.name)}</h5>
        <ul>
          ${comp.strengths.map((s) => `<li>${esc(s.text)}${s.badge ? '<span class="comp-strength">' + esc(s.badge) + '</span>' : ''}</li>`).join('\n          ')}
        </ul>
      </div>
      <div class="comp-col">
        <h5>SC Weaknesses vs. ${esc(targetCompany.name)}</h5>
        <ul>
          ${comp.weaknesses.map((w) => `<li>${esc(w.text)}${w.badge ? '<span class="comp-weak">' + esc(w.badge) + '</span>' : ''}</li>`).join('\n          ')}
        </ul>
      </div>
      <div class="comp-col">
        <h5>SC Differentiators</h5>
        <ul>
          ${comp.differentiators.map((d) => `<li>${esc(d)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>
  </div>`).join('\n\n  ')}
</div>

<!-- SECTION 06: BENCHMARKING -->
<div class="section">
  <div class="section-tag">Section 06</div>
  <div class="section-title">Peer Benchmarking Dashboard</div>
  <div class="section-sub">Supply chain KPI benchmarks, efficiency ratios, and capability maturity scores &mdash; designed for CSCO-level review.</div>

  <div class="charts-grid">
    <div class="chart-box">
      <h4>Inventory Turns Comparison</h4>
      <div class="chart-sub">Higher = better &mdash; faster inventory velocity</div>
      <canvas id="invTurnsChart" height="210"></canvas>
    </div>
    <div class="chart-box">
      <h4>EBIT Margin % Comparison</h4>
      <div class="chart-sub">Profitability benchmark across peers</div>
      <canvas id="ebitMarginChart" height="210"></canvas>
    </div>
  </div>

  <div class="charts-grid" style="margin-top:28px;">
    <div class="chart-box">
      <h4>Supply Chain Capability Maturity Radar (1&ndash;10)</h4>
      <div class="chart-sub">Evaluated across 7 SC dimensions</div>
      <canvas id="scRadarChart" height="240"></canvas>
    </div>
    <div class="chart-box">
      <h4>SC Capabilities Breadth (Named Service Lines)</h4>
      <div class="chart-sub">Count of discrete SC service offerings</div>
      <canvas id="scBreadthChart" height="240"></canvas>
    </div>
  </div>
</div>

<!-- SECTION 07: COMPARISON TABLE -->
<div class="section">
  <div class="section-tag">Section 07</div>
  <div class="section-title">Side-by-Side SC Comparison</div>
  <div class="section-sub">Supply chain capability and KPI matrix across all players.</div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th style="width:22%">SC Capability / KPI</th>
          <th class="highlight-col" style="width:${(78 / (competitors.length + 1)).toFixed(1)}%">&#11088; ${esc(targetCompany.name)} (Target)</th>
          ${competitors.map((c) => `<th style="width:${(78 / (competitors.length + 1)).toFixed(1)}%">${esc(c.name)}</th>`).join('\n          ')}
        </tr>
      </thead>
      <tbody>
        ${comparisonTable.map((row) => `<tr>
          <td class="td-label">${esc(row.label)}</td>
          ${row.values.map((v, i) => `<td${i === 0 ? ' class="highlight-col"' : ''}><span class="${v.status}">${v.status === 'check' ? '&#10004;' : v.status === 'cross' ? '&#10007;' : '~'}</span> ${esc(v.text)}</td>`).join('\n          ')}
        </tr>`).join('\n        ')}
      </tbody>
    </table>
  </div>
</div>

<!-- SECTION 08: GAP ANALYSIS -->
<div class="section">
  <div class="section-tag">Section 08</div>
  <div class="section-title">Supply Chain Gap Analysis</div>
  <div class="section-sub">${gaps.length} critical supply chain gaps identified across multiple dimensions.</div>

  <div class="gap-grid">
    ${gaps.map((gap) => {
      const cls = gap.priority === 'high' ? '' : gap.priority === 'medium' ? ' medium' : ' low';
      const icon = gap.priority === 'high' ? '&#128308;' : gap.priority === 'medium' ? '&#128993;' : '&#128309;';
      return `<div class="gap-item${cls}">
      <div class="priority-badge ${gap.priority}">${icon} ${gap.priority.charAt(0).toUpperCase() + gap.priority.slice(1)} Priority &mdash; ${esc(gap.category)}</div>
      <h5>${esc(gap.title)}</h5>
      <p>${esc(gap.description)}</p>
      <div class="impact">${esc(gap.impact)}</div>
      <div class="who">Better at this: ${gap.betterAtThis.map((b) => '<span>' + esc(b) + '</span>').join(' ')}</div>
    </div>`;
    }).join('\n\n    ')}
  </div>
</div>

<!-- SECTION 09: RECOMMENDATIONS -->
<div class="section">
  <div class="section-tag">Section 09</div>
  <div class="section-title">Top ${recommendations.length} Supply Chain Strategic Recommendations</div>
  <div class="section-sub">Prioritized SC-centric actions focused on working capital optimization, efficiency, and digital SC.</div>

  ${quickWinRecs.length > 0 ? `<div class="rec-horizon">
    <span class="rec-horizon-dot" style="background:#ef4444"></span>
    QUICK WINS &mdash; 0 to 30 Days
  </div>
  <div class="rec-list">
    ${quickWinRecs.map((r) => renderRec(r)).join('\n    ')}
  </div>` : ''}

  ${midTermRecs.length > 0 ? `<div class="rec-horizon">
    <span class="rec-horizon-dot" style="background:#f59e0b"></span>
    MID-TERM INITIATIVES &mdash; 3 to 6 Months
  </div>
  <div class="rec-list">
    ${midTermRecs.map((r) => renderRec(r)).join('\n    ')}
  </div>` : ''}

  ${strategicRecs.length > 0 ? `<div class="rec-horizon">
    <span class="rec-horizon-dot" style="background:#3b82f6"></span>
    STRATEGIC BETS &mdash; 6 to 18 Months
  </div>
  <div class="rec-list">
    ${strategicRecs.map((r) => renderRec(r)).join('\n    ')}
  </div>` : ''}
</div>

<!-- SECTION 10: QUICK WINS -->
<div class="section">
  <div class="section-tag">Section 10</div>
  <div class="section-title">Quick Wins &mdash; 0 to 30 Days</div>
  <div class="section-sub">High-impact, low-effort supply chain actions executable immediately.</div>

  <div class="quickwins-grid">
    ${quickWins.map((qw) => `<div class="qw-card">
      <div class="num">${esc(qw.number)}</div>
      <h5>${esc(qw.title)}</h5>
      <p>${esc(qw.description)}</p>
      <div class="days">&#9201; ${esc(qw.days)}</div>
      <div class="impact-est">&#128176; ${esc(qw.impactEstimate)}</div>
    </div>`).join('\n    ')}
  </div>
</div>

</div><!-- /container -->

<!-- FOOTER -->
<div class="report-footer">
  <div class="container">
    <h4>AutomationX Competitive Audit System &mdash; Supply Chain Edition</h4>
    <p>This report was generated on ${esc(reportDate)} via live website analysis (Playwright browser automation), web intelligence searches, and financial data aggregation. Recommendations are strategic and should be validated against internal data.</p>
    <p style="margin-top:12px;">Competitors analyzed: ${competitors.map((c) => esc(c.name) + ' (' + esc(c.website) + ')').join(' &middot; ')} | Framework: Plan&ndash;Source&ndash;Make&ndash;Deliver&ndash;Return | Audience: CSCO &middot; COO &middot; CXO</p>
  </div>
</div>

<script>
${generateChartJs(report)}
<\/script>
</body>
</html>`;
}

// ─── Helpers ────────────────────────────────────────────────

function esc(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function profileRow(label: string, value?: string): string {
  if (!value) return '';
  return `<div class="stat-row"><span>${esc(label)}</span><span class="val">${esc(value)}</span></div>`;
}

function renderRec(r: { number: number; title: string; description: string; impact: string; effort: string; wcImpact?: string; timeline: string }): string {
  return `<div class="rec-item">
      <div class="rec-number">${r.number}</div>
      <div class="rec-content">
        <h5>${esc(r.title)}</h5>
        <p>${esc(r.description)}</p>
        <div class="rec-meta">
          <span class="meta-pill impact-${r.impact === 'high' ? 'high' : 'med'}">${r.impact === 'high' ? 'High' : 'Medium'} Impact</span>
          <span class="meta-pill effort-${r.effort}">${r.effort.charAt(0).toUpperCase() + r.effort.slice(1)} Effort</span>
          ${r.wcImpact ? `<span class="meta-pill wc">&#128176; ${esc(r.wcImpact)}</span>` : ''}
          <span class="meta-pill timeline">&#9201; ${esc(r.timeline)}</span>
        </div>
      </div>
    </div>`;
}

function generateChartJs(report: AuditReport): string {
  const { financials, workingCapital, competitors, targetCompany } = report;
  const allCompanies = [
    { name: targetCompany.name, wc: workingCapital, scMaturity: report.competitors[0]?.scMaturity, namedScServices: report.scServices.length },
    ...competitors.map((c) => ({ name: c.name, wc: c.workingCapital, scMaturity: c.scMaturity, namedScServices: c.namedScServices })),
  ];

  const chartColors = ['#00a8e8', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

  // Revenue vs COGS
  const revLabels = financials.map((f) => f.label);
  const revData = financials.map((f) => f.revenue);
  const cogsData = financials.map((f) => f.cogs);

  // GM Trend: target + competitors
  const gmDatasets: string[] = [];
  const targetGmData = financials.map((f) => f.grossMarginPct);
  gmDatasets.push(`{ label: '${esc(targetCompany.name)} GM%', data: [${targetGmData.join(',')}], borderColor: '${chartColors[0]}', backgroundColor: 'rgba(0,168,232,0.1)', pointBackgroundColor: '${chartColors[0]}', tension: 0.4, fill: true }`);
  competitors.forEach((comp, i) => {
    const gmData = comp.financials.map((f) => f.grossMarginPct);
    if (gmData.length > 0) {
      gmDatasets.push(`{ label: '${esc(comp.name)} GM%', data: [${gmData.join(',')}], borderColor: '${chartColors[(i + 1) % chartColors.length]}', pointBackgroundColor: '${chartColors[(i + 1) % chartColors.length]}', tension: 0.4 }`);
    }
  });

  // C2C comparison
  const c2cLabels = allCompanies.map((c) => c.name);
  const c2cData = allCompanies.map((c) => c.wc.c2c);
  const c2cColors = c2cData.map((v) => v <= 20 ? '#10b981' : v <= 50 ? '#f59e0b' : '#ef4444');

  // DSO/DIO/DPO
  const wcLabels = allCompanies.map((c) => c.name);
  const dsoData = allCompanies.map((c) => c.wc.dso);
  const dioData = allCompanies.map((c) => c.wc.dio);
  const dpoData = allCompanies.map((c) => c.wc.dpo);

  // Inventory turns
  const invLabels = allCompanies.map((c) => c.name);
  const invData = allCompanies.map((c) => c.wc.inventoryTurns);
  const invColors = invData.map((_, i) => chartColors[i % chartColors.length]);

  // EBIT margin
  const latestFinancials = financials[financials.length - 1];
  const ebitData = [latestFinancials?.ebitMarginPct ?? 0, ...competitors.map((c) => c.financials[c.financials.length - 1]?.ebitMarginPct ?? 0)];
  const ebitLabels = [targetCompany.name, ...competitors.map((c) => c.name)];
  const ebitColors = ebitData.map((_, i) => chartColors[i % chartColors.length]);

  // SC Radar
  const radarLabels = ['Demand Planning', 'Inventory Optimization', 'Supplier Collaboration', 'Mfg. Flexibility', 'Logistics & Network', 'Digital SC / AI', 'Resilience & Risk'];
  const radarDatasets: string[] = [];
  // We use the first competitor's maturity as a proxy pattern for the target
  // In real implementation, the audit agent populates this
  allCompanies.forEach((comp, i) => {
    if (comp.scMaturity) {
      const m = comp.scMaturity;
      radarDatasets.push(`{ label: '${esc(comp.name)}', data: [${m.demandPlanning},${m.inventoryOptimization},${m.supplierCollaboration},${m.mfgFlexibility},${m.logisticsNetwork},${m.digitalScAi},${m.resilienceRisk}], borderColor: '${chartColors[i % chartColors.length]}', backgroundColor: 'rgba(${hexToRgb(chartColors[i % chartColors.length])},0.1)', pointBackgroundColor: '${chartColors[i % chartColors.length]}' }`);
    }
  });

  // SC Breadth
  const breadthLabels = allCompanies.map((c) => c.name);
  const breadthData = allCompanies.map((c) => c.namedScServices);
  const breadthColors = breadthData.map((_, i) => chartColors[i % chartColors.length]);

  return `
// Revenue vs COGS
new Chart(document.getElementById('revCOGSChart'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(revLabels)},
    datasets: [
      { label: 'Revenue', data: ${JSON.stringify(revData)}, backgroundColor: '#00a8e8', borderRadius: 6 },
      { label: 'COGS', data: ${JSON.stringify(cogsData)}, backgroundColor: '#1e4d8c', borderRadius: 6 }
    ]
  },
  options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: false, ticks: { callback: v => '$' + v + 'B' } } } }
});

// GM Trend
new Chart(document.getElementById('gmTrendChart'), {
  type: 'line',
  data: {
    labels: ${JSON.stringify(revLabels)},
    datasets: [${gmDatasets.join(',\n      ')}]
  },
  options: { responsive: true, scales: { y: { ticks: { callback: v => v + '%' } } } }
});

// C2C
new Chart(document.getElementById('c2cChart'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(c2cLabels)},
    datasets: [{ label: 'Cash-to-Cash Cycle (Days)', data: ${JSON.stringify(c2cData)}, backgroundColor: ${JSON.stringify(c2cColors)}, borderRadius: 8 }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + 'd' } } } }
});

// DSO DIO DPO
new Chart(document.getElementById('dsodiodpoChart'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(wcLabels)},
    datasets: [
      { label: 'DSO', data: ${JSON.stringify(dsoData)}, backgroundColor: '#00a8e8', borderRadius: 4 },
      { label: 'DIO', data: ${JSON.stringify(dioData)}, backgroundColor: '#f59e0b', borderRadius: 4 },
      { label: 'DPO', data: ${JSON.stringify(dpoData)}, backgroundColor: '#10b981', borderRadius: 4 }
    ]
  },
  options: { responsive: true, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + 'd' } } } }
});

// Inventory Turns
new Chart(document.getElementById('invTurnsChart'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(invLabels)},
    datasets: [{ label: 'Inventory Turns', data: ${JSON.stringify(invData)}, backgroundColor: ${JSON.stringify(invColors)}, borderRadius: 8 }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + '\\u00d7' } } } }
});

// EBIT Margin
new Chart(document.getElementById('ebitMarginChart'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(ebitLabels)},
    datasets: [{ label: 'EBIT Margin %', data: ${JSON.stringify(ebitData)}, backgroundColor: ${JSON.stringify(ebitColors)}, borderRadius: 8 }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => v + '%' } } } }
});

// SC Maturity Radar
new Chart(document.getElementById('scRadarChart'), {
  type: 'radar',
  data: {
    labels: ${JSON.stringify(radarLabels)},
    datasets: [${radarDatasets.join(',\n      ')}]
  },
  options: { responsive: true, scales: { r: { min: 0, max: 10, ticks: { stepSize: 2 } } } }
});

// SC Breadth
new Chart(document.getElementById('scBreadthChart'), {
  type: 'bar',
  data: {
    labels: ${JSON.stringify(breadthLabels)},
    datasets: [{ label: 'Named SC Service Lines', data: ${JSON.stringify(breadthData)}, backgroundColor: ${JSON.stringify(breadthColors)}, borderRadius: 8 }]
  },
  options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
});
`;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Full CSS (matches flex-audit-report.html exactly) ──────

const CSS_STYLES = `
  :root {
    --navy: #0a1628;
    --navy2: #112240;
    --blue: #1e4d8c;
    --accent: #00a8e8;
    --accent2: #00d4aa;
    --warn: #f59e0b;
    --danger: #ef4444;
    --success: #10b981;
    --light: #f0f4f8;
    --text: #1a2332;
    --muted: #64748b;
    --border: #e2e8f0;
    --white: #ffffff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: var(--light); color: var(--text); line-height: 1.65; }
  .cover { background: linear-gradient(135deg, var(--navy) 0%, var(--blue) 60%, var(--accent) 100%); color: var(--white); padding: 80px 60px; min-height: 360px; display: flex; flex-direction: column; justify-content: center; }
  .cover-badge { background: rgba(255,255,255,.15); display: inline-block; padding: 6px 18px; border-radius: 40px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; }
  .cover h1 { font-size: 40px; font-weight: 800; line-height: 1.2; margin-bottom: 14px; }
  .cover h1 span { color: var(--accent); }
  .cover-sub { font-size: 16px; opacity: .8; margin-bottom: 8px; }
  .cover-audience { background: rgba(0,168,232,.3); display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 28px; }
  .cover-meta { display: flex; gap: 40px; margin-top: 8px; flex-wrap: wrap; }
  .cover-meta-item label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; opacity: .65; display: block; }
  .cover-meta-item span { font-size: 15px; font-weight: 600; }
  .container { max-width: 1140px; margin: 0 auto; padding: 0 32px; }
  .section { padding: 56px 0; }
  .section + .section { border-top: 1px solid var(--border); }
  .section-tag { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); font-weight: 700; margin-bottom: 8px; }
  .section-title { font-size: 28px; font-weight: 800; color: var(--navy); margin-bottom: 12px; }
  .section-sub { color: var(--muted); font-size: 15px; max-width: 720px; margin-bottom: 36px; }
  .exec-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 36px; }
  .exec-card { background: var(--white); border-radius: 12px; padding: 24px 20px; border: 1px solid var(--border); }
  .exec-card .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 8px; }
  .exec-card .value { font-size: 28px; font-weight: 800; color: var(--navy); line-height: 1; }
  .exec-card .sublabel { font-size: 12px; color: var(--muted); margin-top: 6px; }
  .exec-card.accent { border-top: 3px solid var(--accent); }
  .exec-card.warn { border-top: 3px solid var(--warn); }
  .exec-card.success { border-top: 3px solid var(--success); }
  .exec-card.danger { border-top: 3px solid var(--danger); }
  .summary-box { background: var(--navy); color: var(--white); border-radius: 14px; padding: 32px 36px; margin-bottom: 32px; }
  .summary-box h3 { font-size: 18px; margin-bottom: 16px; color: var(--accent); }
  .summary-box p { line-height: 1.75; opacity: .88; font-size: 15px; }
  .risk-opps { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 24px; }
  .risk-box { background: var(--white); border-radius: 12px; padding: 22px 24px; border: 1px solid var(--border); }
  .risk-box h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 14px; }
  .risk-box h4.red { color: var(--danger); }
  .risk-box h4.green { color: var(--success); }
  .risk-box ul { list-style: none; }
  .risk-box ul li { font-size: 13.5px; padding: 5px 0; border-bottom: 1px solid var(--border); display: flex; gap: 8px; align-items: flex-start; }
  .risk-box ul li:last-child { border-bottom: none; }
  .risk-box ul li::before { content: "\\25B8"; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .risk-box ul.red li::before { color: var(--danger); }
  .risk-box ul.green li::before { color: var(--success); }
  .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .overview-card { background: var(--white); border-radius: 14px; padding: 28px; border: 1px solid var(--border); }
  .overview-card h4 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--accent); margin-bottom: 16px; }
  .stat-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); font-size: 14px; }
  .stat-row:last-child { border-bottom: none; }
  .stat-row .val { font-weight: 700; color: var(--navy); text-align: right; max-width: 60%; }
  .tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .tag { background: var(--light); border: 1px solid var(--border); border-radius: 6px; padding: 4px 10px; font-size: 12px; color: var(--navy); font-weight: 500; }
  .tag.blue { background: #e8f4fd; border-color: #b3d9f5; color: var(--blue); }
  .tag.green { background: #d1fae5; border-color: #6ee7b7; color: #065f46; }
  .tag.warn { background: #fef3c7; border-color: #fcd34d; color: #92400e; }
  .tag.red { background: #fee2e2; border-color: #fca5a5; color: #991b1b; }
  .vc-container { background: var(--white); border-radius: 14px; padding: 32px; border: 1px solid var(--border); margin-bottom: 28px; }
  .vc-container h4 { font-size: 15px; font-weight: 800; color: var(--navy); margin-bottom: 20px; }
  .value-chain { display: flex; gap: 0; overflow-x: auto; border-radius: 10px; overflow: hidden; }
  .vc-step { background: var(--navy2); color: var(--white); padding: 20px 16px; text-align: center; flex: 1; min-width: 140px; position: relative; }
  .vc-step:not(:last-child)::after { content: '\\25B6'; position: absolute; right: -10px; top: 50%; transform: translateY(-50%); color: var(--accent); font-size: 16px; z-index: 2; }
  .vc-step.strong { background: var(--blue); }
  .vc-step.gap { background: #7f1d1d; }
  .vc-step .vc-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; opacity: .65; margin-bottom: 6px; }
  .vc-step .vc-name { font-size: 12px; font-weight: 700; margin-bottom: 8px; }
  .vc-step .vc-bullets { font-size: 10.5px; opacity: .8; line-height: 1.5; text-align: left; }
  .vc-legend { display: flex; gap: 20px; margin-top: 14px; font-size: 12px; }
  .vc-legend span { display: flex; align-items: center; gap: 6px; }
  .vc-dot { width: 12px; height: 12px; border-radius: 3px; }
  .fin-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .fin-kpi { background: var(--white); border-radius: 12px; padding: 20px 18px; border: 1px solid var(--border); text-align: center; }
  .fin-kpi .fk-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 8px; }
  .fin-kpi .fk-value { font-size: 24px; font-weight: 800; color: var(--navy); line-height: 1; }
  .fin-kpi .fk-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .fin-kpi.up .fk-value { color: var(--success); }
  .fin-kpi.down .fk-value { color: var(--danger); }
  .fin-kpi.warn .fk-value { color: var(--warn); }
  .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  .chart-box { background: var(--white); border-radius: 14px; border: 1px solid var(--border); padding: 28px; }
  .chart-box h4 { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
  .chart-box .chart-sub { font-size: 12px; color: var(--muted); margin-bottom: 16px; }
  .wc-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 28px 0; }
  .wc-card { background: var(--white); border-radius: 12px; padding: 20px; border: 1px solid var(--border); border-top: 3px solid var(--accent); text-align: center; }
  .wc-card.warn { border-top-color: var(--warn); }
  .wc-card.danger { border-top-color: var(--danger); }
  .wc-card.success { border-top-color: var(--success); }
  .wc-card .wc-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 8px; }
  .wc-card .wc-value { font-size: 30px; font-weight: 900; color: var(--navy); line-height: 1; }
  .wc-card .wc-unit { font-size: 12px; font-weight: 600; color: var(--muted); margin-top: 4px; }
  .wc-card .wc-vs { font-size: 11px; margin-top: 8px; padding: 3px 8px; border-radius: 20px; display: inline-block; font-weight: 700; }
  .wc-card .wc-vs.bad { background: #fee2e2; color: #991b1b; }
  .wc-card .wc-vs.good { background: #d1fae5; color: #065f46; }
  .wc-card .wc-vs.neutral { background: var(--light); color: var(--navy); }
  .comp-card { background: var(--white); border-radius: 16px; border: 1px solid var(--border); overflow: hidden; margin-bottom: 32px; }
  .comp-header { padding: 24px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
  .comp-header-left { display: flex; align-items: center; gap: 18px; }
  .comp-icon { width: 52px; height: 52px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; color: var(--white); flex-shrink: 0; }
  .comp-name { font-size: 20px; font-weight: 800; color: var(--navy); }
  .comp-tagline { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .comp-badge { background: var(--light); border: 1px solid var(--border); border-radius: 8px; padding: 6px 14px; font-size: 12px; font-weight: 700; color: var(--navy); white-space: nowrap; }
  .comp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); border-bottom: 1px solid var(--border); }
  .comp-kpi { padding: 16px 20px; border-right: 1px solid var(--border); text-align: center; }
  .comp-kpi:last-child { border-right: none; }
  .comp-kpi .ck-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-bottom: 4px; }
  .comp-kpi .ck-value { font-size: 20px; font-weight: 800; color: var(--navy); }
  .comp-kpi .ck-sub { font-size: 10px; color: var(--muted); }
  .comp-body { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; }
  .comp-col { padding: 22px 24px; border-right: 1px solid var(--border); }
  .comp-col:last-child { border-right: none; }
  .comp-col h5 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 12px; }
  .comp-col ul { list-style: none; }
  .comp-col ul li { font-size: 13px; padding: 5px 0; color: var(--text); display: flex; align-items: flex-start; gap: 8px; }
  .comp-col ul li::before { content: "\\2192"; color: var(--accent); font-weight: 700; flex-shrink: 0; margin-top: 1px; }
  .comp-strength { background: #d1fae5; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 700; color: #065f46; margin-left: auto; flex-shrink: 0; }
  .comp-weak { background: #fee2e2; border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 700; color: #991b1b; margin-left: auto; flex-shrink: 0; }
  .table-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid var(--border); background: var(--white); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead th { background: var(--navy); color: var(--white); padding: 14px 18px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
  tbody tr:nth-child(even) { background: var(--light); }
  tbody td { padding: 13px 18px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr:last-child td { border-bottom: none; }
  .td-label { font-weight: 700; color: var(--navy); font-size: 12.5px; }
  .check { color: var(--success); font-weight: 700; }
  .cross { color: var(--danger); font-weight: 700; }
  .partial { color: var(--warn); font-weight: 700; }
  .highlight-col { background: rgba(0, 168, 232, 0.06) !important; }
  .gap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .gap-item { background: var(--white); border-radius: 12px; border: 1px solid var(--border); padding: 22px 24px; border-left: 4px solid var(--danger); }
  .gap-item.medium { border-left-color: var(--warn); }
  .gap-item.low { border-left-color: var(--accent); }
  .gap-item h5 { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 6px; }
  .gap-item p { font-size: 13px; color: var(--muted); line-height: 1.6; }
  .gap-item .who { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); margin-top: 10px; }
  .gap-item .who span { background: var(--light); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; margin-left: 4px; color: var(--navy); }
  .gap-item .impact { font-size: 11px; color: var(--muted); margin-top: 6px; font-style: italic; }
  .priority-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-bottom: 10px; }
  .priority-badge.high { background: #fee2e2; color: #991b1b; }
  .priority-badge.medium { background: #fef3c7; color: #92400e; }
  .priority-badge.low { background: #dbeafe; color: #1e40af; }
  .rec-horizon { background: var(--light); border-radius: 10px; padding: 10px 18px; font-size: 13px; font-weight: 700; color: var(--navy); margin: 28px 0 16px; display: flex; align-items: center; gap: 10px; }
  .rec-horizon-dot { width: 10px; height: 10px; border-radius: 50%; }
  .rec-list { display: flex; flex-direction: column; gap: 14px; }
  .rec-item { background: var(--white); border-radius: 12px; border: 1px solid var(--border); padding: 20px 26px; display: flex; gap: 18px; align-items: flex-start; }
  .rec-number { background: var(--navy); color: var(--white); font-size: 14px; font-weight: 800; width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .rec-content h5 { font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 5px; }
  .rec-content p { font-size: 13px; color: var(--muted); line-height: 1.65; }
  .rec-meta { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .meta-pill { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
  .meta-pill.impact-high { background: #dcfce7; color: #14532d; }
  .meta-pill.impact-med { background: #fef9c3; color: #713f12; }
  .meta-pill.effort-low { background: #dbeafe; color: #1e3a8a; }
  .meta-pill.effort-high { background: #fce7f3; color: #831843; }
  .meta-pill.effort-med { background: #f3e8ff; color: #581c87; }
  .meta-pill.timeline { background: var(--light); color: var(--navy); }
  .meta-pill.wc { background: #ecfdf5; color: #065f46; }
  .quickwins-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .qw-card { background: linear-gradient(135deg, var(--navy), var(--blue)); border-radius: 14px; padding: 26px; color: var(--white); }
  .qw-card .num { font-size: 34px; font-weight: 900; color: var(--accent); line-height: 1; margin-bottom: 10px; }
  .qw-card h5 { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  .qw-card p { font-size: 12.5px; opacity: .8; line-height: 1.6; }
  .qw-card .days { margin-top: 12px; background: rgba(255,255,255,.1); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; display: inline-block; }
  .qw-card .impact-est { margin-top: 8px; background: rgba(0,168,232,.25); border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 700; display: inline-block; }
  .report-footer { background: var(--navy); color: var(--white); padding: 40px 60px; margin-top: 60px; }
  .report-footer p { opacity: .55; font-size: 13px; margin-top: 8px; }
  .report-footer h4 { font-size: 16px; font-weight: 700; color: var(--accent); }
`;
