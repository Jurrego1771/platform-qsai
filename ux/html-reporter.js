import fs from 'fs';
import path from 'path';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  serious: '#ea580c',
  moderate: '#ca8a04',
  minor: '#16a34a',
};

const SCORE_COLOR = (score) => {
  if (score >= 90) return '#16a34a';
  if (score >= 75) return '#65a30d';
  if (score >= 60) return '#ca8a04';
  if (score >= 45) return '#ea580c';
  return '#dc2626';
};

function imageToBase64(imgPath) {
  if (!imgPath || !fs.existsSync(imgPath)) return null;
  return `data:image/png;base64,${fs.readFileSync(imgPath).toString('base64')}`;
}

function scoreBar(score) {
  const color = SCORE_COLOR(score);
  return `<div style="display:flex;align-items:center;gap:8px;">
    <div style="flex:1;background:#e5e7eb;border-radius:4px;height:8px;">
      <div style="width:${score}%;background:${color};height:8px;border-radius:4px;"></div>
    </div>
    <span style="font-weight:700;color:${color};min-width:36px;">${score}</span>
  </div>`;
}

export function generateHtmlReport(results, { title, date, env, branch, outputPath }) {
  const allViolations = results.flatMap(r =>
    (r.auditResult.axe?.violations || []).map(v => ({
      view: r.view?.name || r.name,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes,
    }))
  );

  const avgScore = Math.round(results.reduce((s, r) => s + r.scores.overall, 0) / results.length);

  const viewSections = results.map(({ view, auditResult, scores, diffResult }) => {
    const desktopImg = imageToBase64(auditResult.screenshots?.desktop);
    const mobileImg = imageToBase64(auditResult.screenshots?.mobile);
    const diffImg = diffResult?.isRegression ? imageToBase64(auditResult.screenshots?.diff) : null;
    const viewName = view?.name || auditResult.name;

    const violations = auditResult.axe?.violations || [];
    const violationsHtml = violations.length === 0
      ? '<p style="color:#16a34a;">✅ Sin violaciones de accesibilidad</p>'
      : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f3f4f6;"><th style="padding:6px 8px;text-align:left;">Impact</th><th style="padding:6px 8px;text-align:left;">Issue</th><th style="padding:6px 8px;text-align:left;">Nodos</th></tr>
          ${violations.map(v => `<tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:6px 8px;"><span style="background:${SEVERITY_COLORS[v.impact] || '#6b7280'};color:#fff;padding:2px 6px;border-radius:3px;font-size:11px;">${v.impact}</span></td>
            <td style="padding:6px 8px;">${v.description}</td>
            <td style="padding:6px 8px;">${v.nodes}</td>
          </tr>`).join('')}
        </table>`;

    const diffHtml = diffResult ? `
      <p style="margin:8px 0;">${diffResult.isRegression
        ? `<span style="color:#dc2626;font-weight:600;">🔴 Regresión visual: ${(diffResult.diffPercent * 100).toFixed(2)}% de pixels cambiaron</span>`
        : `<span style="color:#16a34a;">✅ Sin regresión visual (${(diffResult.diffPercent * 100).toFixed(2)}% diff)</span>`
      }</p>
      ${diffImg ? `<img src="${diffImg}" style="max-width:100%;border:1px solid #e5e7eb;border-radius:4px;" alt="Visual diff">` : ''}` : '';

    const consoleErrorsHtml = auditResult.consoleErrors?.length
      ? `<h4 style="margin:16px 0 8px;color:#374151;">Errores de consola (${auditResult.consoleErrors.length})</h4>
         <ul style="font-size:12px;color:#dc2626;background:#fff5f5;padding:8px 12px;border-radius:4px;list-style:none;margin:0;">
           ${auditResult.consoleErrors.slice(0, 5).map(e => `<li>${e.slice(0, 150)}</li>`).join('')}
         </ul>` : '';

    return `
    <details style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:12px;">
      <summary style="padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;background:#f9fafb;border-radius:8px;">
        <span style="font-weight:600;font-size:15px;">${viewName}</span>
        <span style="font-size:20px;font-weight:700;color:${SCORE_COLOR(scores.overall)};">${scores.overall}/100</span>
      </summary>
      <div style="padding:16px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
          <div><small style="color:#6b7280;">Clarity</small>${scoreBar(scores.clarity)}</div>
          <div><small style="color:#6b7280;">Accessibility</small>${scoreBar(scores.accessibility)}</div>
          <div><small style="color:#6b7280;">Friction</small>${scoreBar(scores.friction)}</div>
          <div><small style="color:#6b7280;">Visual Consistency</small>${scoreBar(scores.visualConsistency)}</div>
          <div><small style="color:#6b7280;">Mobile UX</small>${scoreBar(scores.mobileUX)}</div>
        </div>
        ${diffHtml}
        ${consoleErrorsHtml}
        <h4 style="margin:16px 0 8px;color:#374151;">Accesibilidad</h4>
        ${violationsHtml}
        <h4 style="margin:16px 0 8px;color:#374151;">Screenshots</h4>
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          ${desktopImg ? `<div><small style="color:#6b7280;display:block;margin-bottom:4px;">Desktop (1280×800)</small><img src="${desktopImg}" style="max-width:480px;width:100%;border:1px solid #e5e7eb;border-radius:4px;" alt="${viewName} desktop"></div>` : ''}
          ${mobileImg ? `<div><small style="color:#6b7280;display:block;margin-bottom:4px;">Mobile (375×812)</small><img src="${mobileImg}" style="max-width:180px;width:100%;border:1px solid #e5e7eb;border-radius:4px;" alt="${viewName} mobile"></div>` : ''}
        </div>
      </div>
    </details>`;
  }).join('');

  const topIssues = allViolations
    .sort((a, b) => ['critical', 'serious', 'moderate', 'minor'].indexOf(a.impact) - ['critical', 'serious', 'moderate', 'minor'].indexOf(b.impact))
    .slice(0, 10);

  const issuesTableHtml = topIssues.length === 0 ? '<p style="color:#16a34a;">✅ Sin violaciones críticas</p>' : `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f3f4f6;"><th style="padding:8px;text-align:left;">Severity</th><th style="padding:8px;text-align:left;">Vista</th><th style="padding:8px;text-align:left;">Issue</th></tr>
      ${topIssues.map(v => `<tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:8px;"><span style="background:${SEVERITY_COLORS[v.impact] || '#6b7280'};color:#fff;padding:2px 8px;border-radius:3px;font-size:11px;">${v.impact}</span></td>
        <td style="padding:8px;color:#374151;">${v.view}</td>
        <td style="padding:8px;">${v.description}</td>
      </tr>`).join('')}
    </table>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; margin: 0; background: #f9fafb; }
    .container { max-width: 960px; margin: 0 auto; padding: 24px 16px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 17px; color: #374151; margin: 28px 0 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    details summary::-webkit-details-marker { display: none; }
  </style>
</head>
<body>
<div class="container">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px;">
    <div>
      <h1>UX Audit — Mediastream Platform</h1>
      <p style="color:#6b7280;margin:2px 0;font-size:14px;">${branch ? `Branch: <strong>${branch}</strong> · ` : ''}${date} · ${env}</p>
    </div>
    <div style="text-align:center;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px 24px;">
      <div style="font-size:36px;font-weight:800;color:${SCORE_COLOR(avgScore)};">${avgScore}</div>
      <div style="font-size:12px;color:#6b7280;">SCORE GENERAL / 100</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:28px;">
    ${['Clarity', 'Accessibility', 'Friction', 'Visual', 'Mobile'].map((label, i) => {
      const keys = ['clarity', 'accessibility', 'friction', 'visualConsistency', 'mobileUX'];
      const avg = Math.round(results.reduce((s, r) => s + r.scores[keys[i]], 0) / results.length);
      return `<div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:${SCORE_COLOR(avg)};">${avg}</div>
        <div style="font-size:11px;color:#6b7280;">${label}</div>
      </div>`;
    }).join('')}
  </div>

  <h2>Issues prioritizados</h2>
  ${issuesTableHtml}

  <h2>Análisis por vista</h2>
  ${viewSections}

  <p style="color:#9ca3af;font-size:12px;margin-top:32px;text-align:center;">Generated by Platform-QSAI UX Auditor · ${date}</p>
</div>
</body>
</html>`;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);
  console.log(`HTML report saved → ${outputPath}`);
}
