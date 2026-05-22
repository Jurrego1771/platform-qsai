import fs from 'fs';
import path from 'path';
import { formatScoreSummary } from './scorer.js';

export function generateAuditReport(results, outputPath) {
  const date = new Date().toISOString().split('T')[0];
  const lines = [
    `# UX Baseline — Mediastream Platform`,
    `**Generated:** ${date}`,
    `**Environment:** ${process.env.MS_ENV || 'dev'}`,
    `**Vistas auditadas:** ${results.length}`,
    '',
    '> Baseline UX de la plataforma. Sirve como referencia para auditorías futuras.',
    '> Friction y Visual Consistency son placeholders — Claude los completa durante el análisis.',
    '',
    '---',
    '',
    '## Resumen ejecutivo',
    '',
  ];

  const overallAvg = Math.round(
    results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length
  );

  lines.push(`**Score promedio de plataforma: ${overallAvg}/100**`, '');

  const allViolations = results.flatMap(r => (r.auditResult.axe?.violations || []).map(v => ({
    view: r.view.name,
    impact: v.impact,
    description: v.description,
    nodes: v.nodes,
  })));

  const criticals = allViolations.filter(v => v.impact === 'critical');
  const serious = allViolations.filter(v => v.impact === 'serious');

  if (criticals.length > 0) lines.push(`**⛔ ${criticals.length} violaciones críticas de accesibilidad detectadas**`, '');
  if (serious.length > 0) lines.push(`**⚠️ ${serious.length} violaciones serias de accesibilidad detectadas**`, '');

  lines.push('---', '', '## Vistas auditadas', '');

  for (const { view, auditResult, scores } of results) {
    lines.push(formatScoreSummary(view.name, scores), '');

    lines.push('**Screenshots:**', '');
    if (auditResult.screenshots.desktop) {
      const rel = path.relative(path.dirname(outputPath), auditResult.screenshots.desktop).replace(/\\/g, '/');
      lines.push(`- Desktop: \`${rel}\``);
    }
    if (auditResult.screenshots.mobile) {
      const rel = path.relative(path.dirname(outputPath), auditResult.screenshots.mobile).replace(/\\/g, '/');
      lines.push(`- Mobile: \`${rel}\``);
    }
    lines.push('');

    const violations = auditResult.axe?.violations || [];
    if (violations.length > 0) {
      lines.push('**Violaciones de accesibilidad:**', '');
      lines.push('| Impact | Description | Nodos |');
      lines.push('|--------|-------------|-------|');
      for (const v of violations) {
        lines.push(`| ${v.impact} | ${v.description} | ${v.nodes} |`);
      }
      lines.push('');
    }

    if (auditResult.domIssues.length > 0) {
      lines.push('**Problemas en DOM:**', '');
      const grouped = {};
      for (const issue of auditResult.domIssues) {
        grouped[issue.type] = (grouped[issue.type] || 0) + 1;
      }
      for (const [type, count] of Object.entries(grouped)) {
        lines.push(`- \`${type}\`: ${count} ocurrencias`);
      }
      lines.push('');
    }

    if (auditResult.consoleErrors?.length > 0) {
      lines.push('**Errores de consola:**', '');
      auditResult.consoleErrors.slice(0, 5).forEach(e => lines.push(`- \`${e.slice(0, 120)}\``));
      lines.push('');
    }

    lines.push('---', '');
  }

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`\nAudit baseline report saved → ${outputPath}`);
}

export function generateDiffReport(results, branch, outputDir) {
  const date = new Date().toISOString().split('T')[0];
  const filename = `diff-${branch.replace(/\//g, '-')}-${date}.md`;
  const outputPath = path.join(outputDir, filename);

  const lines = [
    `# UX Diff Report — Branch: \`${branch}\``,
    `**Date:** ${date}`,
    `**Vistas auditadas:** ${results.length}`,
    '',
    '---',
    '',
  ];

  for (const { view, auditResult, scores, baselineScores } of results) {
    lines.push(`## ${view.name}`, '');
    lines.push(formatScoreSummary(view.name, scores), '');

    if (baselineScores) {
      const delta = scores.overall - baselineScores.overall;
      const sign = delta >= 0 ? '+' : '';
      const emoji = delta >= 0 ? '✅' : '🔴';
      lines.push(`${emoji} **Delta vs baseline: ${sign}${delta} pts**`, '');
    }

    if (auditResult.diffResult?.isRegression) {
      lines.push(`🔴 **Regresión visual: ${(auditResult.diffResult.diffPercent * 100).toFixed(2)}% de pixels cambiaron**`, '');
    }

    lines.push('---', '');
  }

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`\nDiff report saved → ${outputPath}`);
  return outputPath;
}
