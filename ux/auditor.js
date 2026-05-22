import 'dotenv/config';
import { chromium } from '@playwright/test';
import { compareScreenshots } from './visual-diff.js';
import fs from 'fs';
import path from 'path';

const DELAY_BETWEEN_ROUTES_MS = 800;

export class Auditor {
  constructor({ baseURL, outputDir, storageState }) {
    this.baseURL = baseURL;
    this.outputDir = outputDir;
    this.storageState = storageState;
  }

  async auditView(viewConfig) {
    const { name, path: viewPath } = viewConfig;
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
      storageState: this.storageState,
      viewport: { width: 1280, height: 800 },
      locale: 'es-CL',
    });
    const page = await ctx.newPage();

    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const result = {
      name,
      path: viewPath,
      screenshots: {},
      axe: null,
      domIssues: [],
      domSnapshot: '',
      renderedHtml: '',
      consoleErrors: [],
    };

    await page.goto(`${this.baseURL}${viewPath}`, { waitUntil: 'networkidle', timeout: 30_000 }).catch(() =>
      page.goto(`${this.baseURL}${viewPath}`, { waitUntil: 'domcontentloaded' })
    );
    await page.waitForTimeout(2000);

    // Desktop screenshot
    fs.mkdirSync(path.join(this.outputDir, 'screenshots'), { recursive: true });
    const desktopPath = path.join(this.outputDir, 'screenshots', `${name}-desktop.png`);
    await page.screenshot({ path: desktopPath, fullPage: true });
    result.screenshots.desktop = desktopPath;

    // HTML body capture (50K chars) — used by heuristics analyzer agent
    result.renderedHtml = await page.evaluate(() => document.body.innerHTML.slice(0, 50000));

    // DOM snapshot for LLM/score analysis (shallow, 3K chars)
    result.domSnapshot = await page.evaluate(() => {
      const clean = (el, depth = 0) => {
        if (depth > 4) return '';
        const role = el.getAttribute('role') || el.tagName.toLowerCase();
        const label = el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.textContent?.trim().slice(0, 60);
        const children = [...el.children].map(c => clean(c, depth + 1)).filter(Boolean).join('');
        if (!label && !children) return '';
        return `${' '.repeat(depth * 2)}<${role}${label ? ` "${label}"` : ''}>${children}</${role}>\n`;
      };
      return clean(document.body).slice(0, 3000);
    });

    // Mobile screenshot
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(400);
    const mobilePath = path.join(this.outputDir, 'screenshots', `${name}-mobile.png`);
    await page.screenshot({ path: mobilePath, fullPage: true });
    result.screenshots.mobile = mobilePath;
    await page.setViewportSize({ width: 1280, height: 800 });

    // Visual regression diff against baseline
    const baselinePath = path.join('./reports/baseline/screenshots', `${name}-desktop.png`);
    const diffPath = path.join(this.outputDir, 'diffs', `${name}-diff.png`);
    if (fs.existsSync(baselinePath) && baselinePath !== desktopPath) {
      result.diffResult = await compareScreenshots(desktopPath, baselinePath, diffPath);
      if (result.diffResult?.isRegression) result.screenshots.diff = diffPath;
    }

    // axe-core accessibility audit
    await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' }).catch(async () => {
      // CSP fallback: inject local copy
      const localAxe = path.resolve('./node_modules/axe-core/axe.min.js');
      if (fs.existsSync(localAxe)) {
        await page.addScriptTag({ content: fs.readFileSync(localAxe, 'utf8') }).catch(() => null);
      }
    });

    try {
      const axeResults = await page.evaluate(async () => {
        await new Promise(r => setTimeout(r, 300));
        return await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'best-practice'] });
      });
      result.axe = {
        violations: axeResults.violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
          example: v.nodes[0]?.html?.slice(0, 200) || '',
        })),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        violationCount: {
          critical: axeResults.violations.filter(v => v.impact === 'critical').length,
          serious: axeResults.violations.filter(v => v.impact === 'serious').length,
          moderate: axeResults.violations.filter(v => v.impact === 'moderate').length,
          minor: axeResults.violations.filter(v => v.impact === 'minor').length,
        },
      };

      const axeDir = path.join(this.outputDir, 'accessibility');
      fs.mkdirSync(axeDir, { recursive: true });
      fs.writeFileSync(path.join(axeDir, `${name}.json`), JSON.stringify(result.axe, null, 2));
    } catch (e) {
      result.axe = { error: e.message, violations: [], violationCount: {} };
    }

    // DOM issue detection
    result.domIssues = await page.evaluate(() => {
      const issues = [];
      document.querySelectorAll('img:not([alt])').forEach(el => {
        issues.push({ type: 'missing-alt', element: el.outerHTML.slice(0, 100) });
      });
      document.querySelectorAll('button, a').forEach(el => {
        const text = el.textContent?.trim() || el.getAttribute('aria-label') || el.getAttribute('title');
        if (!text) issues.push({ type: 'empty-interactive', element: el.outerHTML.slice(0, 100) });
      });
      document.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(el => {
        const id = el.getAttribute('id');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasAria = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby');
        if (!hasLabel && !hasAria) issues.push({ type: 'unlabeled-input', element: el.outerHTML.slice(0, 100) });
      });
      return issues;
    });

    result.consoleErrors = consoleErrors;

    await browser.close();
    await new Promise(r => setTimeout(r, DELAY_BETWEEN_ROUTES_MS));
    return result;
  }

  async auditFlow(flowConfig) {
    const { name, steps } = flowConfig;
    const browser = await chromium.launch();
    const ctx = await browser.newContext({
      storageState: this.storageState,
      viewport: { width: 1280, height: 800 },
      locale: 'es-CL',
    });
    const page = await ctx.newPage();

    const flowResult = { name, steps: [], screenshots: {}, totalSteps: steps.length, completedSteps: 0 };
    const screenshotDir = path.join(this.outputDir, 'screenshots', 'flows', name);
    fs.mkdirSync(screenshotDir, { recursive: true });

    for (const step of steps) {
      const stepResult = { name: step.name, description: step.description, success: false };

      try {
        if (step.path) {
          await page.goto(`${this.baseURL}${step.path}`, { waitUntil: 'networkidle', timeout: 20_000 })
            .catch(() => page.goto(`${this.baseURL}${step.path}`, { waitUntil: 'domcontentloaded' }));
          await page.waitForTimeout(2000);
        }

        if (step.action) await step.action(page);

        if (step.screenshot !== false) {
          const imgPath = path.join(screenshotDir, `${step.name}.png`);
          await page.screenshot({ path: imgPath, fullPage: false });
          stepResult.screenshotPath = imgPath;
          flowResult.screenshots[step.name] = imgPath;
        }

        if (step.axe) {
          await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' }).catch(() => null);
          const axeResults = await page.evaluate(async () => {
            await new Promise(r => setTimeout(r, 200));
            return await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] });
          }).catch(() => ({ violations: [], passes: [] }));
          stepResult.axeViolations = axeResults.violations.map(v => ({
            id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.length,
          }));
        }

        stepResult.success = true;
        flowResult.completedSteps++;
      } catch (e) {
        stepResult.error = e.message;
        stepResult.success = false;
      }

      flowResult.steps.push(stepResult);
    }

    await browser.close();
    return flowResult;
  }
}
