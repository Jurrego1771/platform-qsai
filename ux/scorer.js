const WEIGHTS = {
  clarity: 0.25,
  accessibility: 0.25,
  friction: 0.20,
  visualConsistency: 0.20,
  mobileUX: 0.10,
};

export function scoreView(auditResult) {
  const clarity = scoreClarity(auditResult);
  const accessibility = scoreAccessibility(auditResult);
  const friction = 70;
  const visualConsistency = 70;
  const mobileUX = scoreMobileUX(auditResult);

  const overall = Math.round(
    clarity * WEIGHTS.clarity +
    accessibility * WEIGHTS.accessibility +
    friction * WEIGHTS.friction +
    visualConsistency * WEIGHTS.visualConsistency +
    mobileUX * WEIGHTS.mobileUX
  );

  return { overall, clarity, accessibility, friction, visualConsistency, mobileUX };
}

function scoreClarity({ domIssues = [] }) {
  const emptyInteractives = domIssues.filter(i => i.type === 'empty-interactive').length;
  const unlabeled = domIssues.filter(i => i.type === 'unlabeled-input').length;
  const missingAlt = domIssues.filter(i => i.type === 'missing-alt').length;
  const penalty = (emptyInteractives * 8) + (unlabeled * 5) + (missingAlt * 3);
  return Math.max(0, 100 - penalty);
}

function scoreAccessibility({ axe }) {
  if (!axe || axe.error) return 50;
  const violations = axe.violations || [];
  const penalty =
    violations.filter(v => v.impact === 'critical').length * 20 +
    violations.filter(v => v.impact === 'serious').length * 10 +
    violations.filter(v => v.impact === 'moderate').length * 5 +
    violations.filter(v => v.impact === 'minor').length * 2;
  return Math.max(0, 100 - penalty);
}

function scoreMobileUX({ domIssues = [] }) {
  const penalty = domIssues.filter(i => i.type === 'missing-alt').length * 5;
  return Math.max(0, 80 - penalty);
}

export function formatScoreSummary(name, scores) {
  const bar = (n) => '█'.repeat(Math.round(n / 10)) + '░'.repeat(10 - Math.round(n / 10));
  return [
    `### ${name}`,
    `**Overall: ${scores.overall}/100**`,
    '',
    `| Dimension         | Score | Bar                  |`,
    `|-------------------|-------|----------------------|`,
    `| Clarity           |  ${String(scores.clarity).padStart(3)} | ${bar(scores.clarity)} |`,
    `| Accessibility     |  ${String(scores.accessibility).padStart(3)} | ${bar(scores.accessibility)} |`,
    `| Friction ⚙️       |  ${String(scores.friction).padStart(3)} | ${bar(scores.friction)} |`,
    `| Visual Consist. ⚙️|  ${String(scores.visualConsistency).padStart(3)} | ${bar(scores.visualConsistency)} |`,
    `| Mobile UX         |  ${String(scores.mobileUX).padStart(3)} | ${bar(scores.mobileUX)} |`,
  ].join('\n');
}
