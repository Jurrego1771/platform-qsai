import 'dotenv/config';
import { Auditor } from './auditor.js';
import { scoreView } from './scorer.js';
import { generateAuditReport, generateDiffReport } from './reporter.js';
import { generateHtmlReport } from './html-reporter.js';
import { ALL_VIEWS, getViewsByNames, getViewsByModule } from './views.js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = process.env.BASE_URL || 'https://dev.platform.mediastre.am';
const BASELINE_DIR = './reports/baseline';
const REPORTS_DIR = './reports';
const DATE = new Date().toISOString().split('T')[0];
const ENV = process.env.MS_ENV || 'dev';

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [key, ...val] = a.replace('--', '').split('=');
      return [key, val.join('=') || true];
    })
);

const mode = args.mode || 'audit';
const branch = args.branch;
const module = args.module;
const viewFilter = args.view;

async function runAudit() {
  console.log(`Running UX audit${module ? ` for module: ${module}` : ' (full platform)'}...\n`);
  fs.mkdirSync(`${BASELINE_DIR}/screenshots`, { recursive: true });
  fs.mkdirSync(`${BASELINE_DIR}/accessibility`, { recursive: true });
  fs.mkdirSync(`${BASELINE_DIR}/diffs`, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const auditor = new Auditor({ baseURL: BASE_URL, outputDir: BASELINE_DIR, storageState: '.auth/user.json' });

  let views;
  if (viewFilter) {
    views = ALL_VIEWS.filter(v => v.name === viewFilter);
  } else if (module) {
    views = getViewsByModule(module);
  } else {
    views = ALL_VIEWS;
  }

  console.log(`Views to audit: ${views.map(v => v.name).join(', ')}\n`);

  const results = [];
  for (const view of views) {
    console.log(`Auditing: ${view.name} (${view.path})`);
    try {
      const auditResult = await auditor.auditView(view);
      const scores = scoreView(auditResult);
      results.push({ view, auditResult, scores });
      console.log(`  Score: ${scores.overall}/100 (clarity: ${scores.clarity}, a11y: ${scores.accessibility})`);
    } catch (e) {
      console.warn(`  ⚠️  Skipped ${view.name}: ${e.message}`);
    }
  }

  if (results.length === 0) {
    console.error('No views audited successfully. Check BASE_URL and authentication.');
    process.exit(1);
  }

  const reportPath = path.join(BASELINE_DIR, 'UX_BASELINE.md');
  generateAuditReport(results, reportPath);
  saveBaselineScores(results);

  generateHtmlReport(results, {
    title: 'UX Audit — Mediastream Platform',
    date: DATE,
    env: ENV,
    outputPath: path.join(REPORTS_DIR, `audit-${DATE}.html`),
  });

  // Save renderedHtml for agent pipeline consumption
  const crawlResults = results.map(({ view, auditResult }) => ({
    route: view.path,
    url: `${BASE_URL}${view.path}`,
    module: view.module,
    html: auditResult.renderedHtml,
    screenshotDesktop: auditResult.screenshots.desktop,
    screenshotMobile: auditResult.screenshots.mobile,
    consoleErrors: auditResult.consoleErrors || [],
    noData: false,
    timestamp: new Date().toISOString(),
  }));
  fs.writeFileSync('./context/ux-crawl-results.json', JSON.stringify(crawlResults, null, 2));
  console.log('\nCrawl results saved → context/ux-crawl-results.json (for agent pipeline)');
}

async function runDiff() {
  if (!branch) {
    console.error('--branch is required.\nUsage: node ux/runner.js --mode=diff --branch=feature/my-branch');
    process.exit(1);
  }

  console.log(`Running UX diff for branch: ${branch}\n`);
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const affectedViewNames = getAffectedViews(branch);
  const views = affectedViewNames ? getViewsByNames(affectedViewNames) : ALL_VIEWS;
  console.log(`Views to diff: ${views.map(v => v.name).join(', ')}\n`);

  const auditor = new Auditor({ baseURL: BASE_URL, outputDir: BASELINE_DIR, storageState: '.auth/user.json' });
  const baselineScores = loadBaselineScores();
  const results = [];

  for (const view of views) {
    console.log(`Auditing: ${view.name}`);
    try {
      const auditResult = await auditor.auditView(view);
      const scores = scoreView(auditResult);
      results.push({ view, auditResult, scores, baselineScores: baselineScores[view.name] || null });
      console.log(`  Score: ${scores.overall}/100`);
    } catch (e) {
      console.warn(`  ⚠️  Skipped ${view.name}: ${e.message}`);
    }
  }

  const mdPath = generateDiffReport(results, branch, REPORTS_DIR);
  generateHtmlReport(results, {
    title: `UX Diff — ${branch}`,
    date: DATE,
    env: ENV,
    branch,
    outputPath: mdPath.replace('.md', '.html'),
  });

  // CI gate: fail if any view drops > 10 pts vs baseline
  const maxDrop = Math.max(0, ...results
    .filter(r => r.baselineScores)
    .map(r => r.baselineScores.overall - r.scores.overall)
  );
  if (maxDrop > 10) {
    console.error(`\n🔴 UX regression: score dropped ${maxDrop} pts in at least one view (threshold: 10)`);
    process.exit(1);
  }
}

async function runFlows() {
  console.log('Running user journey flows...\n');
  fs.mkdirSync(`${BASELINE_DIR}/screenshots/flows`, { recursive: true });
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  const { ALL_FLOWS } = await import('./flows/index.js');
  const auditor = new Auditor({ baseURL: BASE_URL, outputDir: BASELINE_DIR, storageState: '.auth/user.json' });

  const results = [];
  for (const flow of ALL_FLOWS) {
    console.log(`Running flow: ${flow.name} (${flow.steps.length} steps)`);
    const flowResult = await auditor.auditFlow(flow);
    results.push(flowResult);
    console.log(`  Completed: ${flowResult.completedSteps}/${flowResult.totalSteps} steps`);
    flowResult.steps.filter(s => !s.success).forEach(s =>
      console.warn(`  ⚠️  Step "${s.name}" failed: ${s.error}`)
    );
  }

  const reportPath = path.join(REPORTS_DIR, `flows-${DATE}.md`);
  const lines = [`# UX Flow Report — ${DATE}\n`];
  for (const r of results) {
    lines.push(`## ${r.name}`, `Completed: ${r.completedSteps}/${r.totalSteps} steps`, '');
    r.steps.forEach(s => {
      const status = s.success ? '✅' : '❌';
      lines.push(`- ${status} **${s.name}** — ${s.description || ''}`);
      if (s.error) lines.push(`  - Error: ${s.error}`);
      if (s.axeViolations?.length) {
        lines.push(`  - Axe: ${s.axeViolations.map(v => `${v.impact}: ${v.description}`).join(', ')}`);
      }
    });
    lines.push('');
  }
  fs.writeFileSync(reportPath, lines.join('\n'));
  console.log(`\nFlow report saved → ${reportPath}`);
}

function getAffectedViews(branch) {
  let diffOutput;
  try {
    diffOutput = execSync(
      `gh pr diff ${branch} --name-only 2>nul || git diff origin/main...${branch} --name-only`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
  } catch {
    console.warn('Could not get diff — auditing all views');
    return null;
  }

  const changedFiles = diffOutput.trim().split('\n').filter(Boolean);
  const FILE_TO_MODULE = {
    media: 'media', vod: 'media',
    live: 'live', livestream: 'live',
    ad: 'ads', ads: 'ads', vmap: 'ads',
    customer: 'customer', access: 'customer',
    show: 'show', season: 'show', episode: 'show',
    channel: 'channel', epg: 'channel',
    analytics: 'analytics',
    categor: 'platform', settings: 'platform', player: 'player',
  };

  const affectedModules = new Set();
  for (const file of changedFiles) {
    const lower = file.toLowerCase();
    for (const [pattern, mod] of Object.entries(FILE_TO_MODULE)) {
      if (lower.includes(pattern)) affectedModules.add(mod);
    }
    if (lower.includes('layout') || lower.includes('sidebar') || lower.includes('nav') || lower.includes('global')) {
      return null; // audit all
    }
  }

  if (affectedModules.size === 0) return null;
  return ALL_VIEWS.filter(v => affectedModules.has(v.module)).map(v => v.name);
}

function saveBaselineScores(results) {
  const scores = {};
  for (const { view, scores: s } of results) scores[view.name] = s;
  const p = path.join(BASELINE_DIR, 'scores.json');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(scores, null, 2));
}

function loadBaselineScores() {
  const p = path.join(BASELINE_DIR, 'scores.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

if (mode === 'audit') runAudit().catch(console.error);
else if (mode === 'diff') runDiff().catch(console.error);
else if (mode === 'flows') runFlows().catch(console.error);
else {
  console.error(`Unknown mode: ${mode}. Use --mode=audit, --mode=diff, or --mode=flows`);
  process.exit(1);
}
