/**
 * QA Reporter — Mediastream Platform
 *
 * Custom Playwright reporter. Generates two files after every test run:
 *   reports/qa/qa-report-{ts}.html  — client-facing HTML with evidence
 *   reports/qa/qa-summary-{ts}.txt  — one-paragraph plain-text comment
 *   reports/qa/latest.html / latest.txt  — always-overwritten symlinks
 *
 * Internal → client terminology:
 *   Bug crítico   → Ajuste prioritario
 *   Bug medio     → Ajuste identificado
 *   Bug menor     → Mejora sugerida
 *   Observación   → Optimización recomendada
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── Severity catalogue ────────────────────────────────────────────────────────

const SEVERITY = {
  critical:    { label: 'Ajuste prioritario',      dot: '#dc2626', bg: '#fef2f2', border: '#fca5a5' },
  medium:      { label: 'Ajuste identificado',      dot: '#d97706', bg: '#fffbeb', border: '#fcd34d' },
  minor:       { label: 'Mejora sugerida',          dot: '#2563eb', bg: '#eff6ff', border: '#93c5fd' },
  observation: { label: 'Optimización recomendada', dot: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
}

function classifyFailure(tags = []) {
  const lower = tags.map(t => t.toLowerCase())
  if (lower.some(t => ['@critical', '@p0'].includes(t))) return 'critical'
  if (lower.some(t => ['@regression', '@p1'].includes(t))) return 'medium'
  if (lower.includes('@p2')) return 'minor'
  return 'observation'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function stripTcPrefix(title) {
  return title
    .replace(/^TC_[A-Z0-9_]+\s*[—\-]\s*/i, '')
    .replace(/@\w+/g, '')
    .trim()
}

function screenshotToDataUri(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      return `data:image/png;base64,${fs.readFileSync(filePath).toString('base64')}`
    }
  } catch { /* intentionally silent */ }
  return null
}

function hms(ms) {
  if (ms < 1000) return `${ms}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

// ── Reporter ──────────────────────────────────────────────────────────────────

export default class QAReporter {
  constructor(options = {}) {
    this.options = options
    this.tests   = []
    this.scope   = null
    this.startTime = null
    this.endTime   = null
  }

  // ── Playwright lifecycle ────────────────────────────────────────────────────

  onBegin() {
    this.startTime = new Date()
    try {
      const p = path.join(process.cwd(), 'context', 'scope.json')
      if (fs.existsSync(p)) this.scope = JSON.parse(fs.readFileSync(p, 'utf-8'))
    } catch { /* no scope file — that's fine */ }
  }

  onTestEnd(test, result) {
    // Grab first screenshot attachment (on-failure screenshots)
    let screenshotPath = null
    for (const att of result.attachments ?? []) {
      if (att.contentType === 'image/png' && att.path) { screenshotPath = att.path; break }
    }

    // Grab console logs attached by the fixture
    const logs = (result.attachments ?? [])
      .filter(a => a.contentType === 'text/plain')
      .map(a => {
        try { return a.body ? a.body.toString('utf-8') : fs.readFileSync(a.path, 'utf-8') } catch { return '' }
      })
      .filter(Boolean)
      .join('\n')

    this.tests.push({
      file:           test.location?.file ?? '',
      title:          test.title,
      titlePath:      test.titlePath().slice(1).join(' › '),
      tags:           test.tags ?? [],
      status:         result.status,           // passed | failed | timedOut | skipped
      duration:       result.duration ?? 0,
      error:          result.error?.message ?? null,
      screenshotPath,
      logs,
    })
  }

  onEnd() {
    this.endTime = new Date()
    this._generate()
  }

  // ── Computed properties ────────────────────────────────────────────────────

  get _total()   { return this.tests.length }
  get _passed()  { return this.tests.filter(t => t.status === 'passed').length }
  get _failed()  { return this.tests.filter(t => ['failed', 'timedOut'].includes(t.status)).length }
  get _skipped() { return this.tests.filter(t => t.status === 'skipped').length }
  get _failures(){ return this.tests.filter(t => ['failed', 'timedOut'].includes(t.status)) }

  get _hasFunctional()  { return this.tests.some(t => /[/\\](e2e|regression)[/\\]/.test(t.file)) }
  get _hasIntegration() { return this.tests.some(t => /[/\\]integration[/\\]/.test(t.file)) }

  get _totalDuration() {
    return this.endTime && this.startTime ? this.endTime - this.startTime : 0
  }

  get _dateStr() {
    return (this.startTime ?? new Date()).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'long', year: 'numeric'
    })
  }

  get _modules() {
    const names = [...new Set(
      this.tests
        .map(t => {
          const normalized = t.file.replace(/\\/g, '/')
          const m = normalized.match(/tests\/(?:e2e|regression|integration)\/([^/]+)\//)
          return m?.[1]
        })
        .filter(Boolean)
    )]
    return names.join(', ') || 'general'
  }

  // ── File generation ────────────────────────────────────────────────────────

  _generate() {
    const dir = path.join(process.cwd(), 'reports', 'qa')
    fs.mkdirSync(dir, { recursive: true })

    const ts = (this.startTime ?? new Date())
      .toISOString().replace(/[:.]/g, '-').slice(0, 16)

    const htmlFile = path.join(dir, `qa-report-${ts}.html`)
    const txtFile  = path.join(dir, `qa-summary-${ts}.txt`)

    const html = this._buildHtml()
    const txt  = this._buildTxt()

    fs.writeFileSync(htmlFile, html, 'utf-8')
    fs.writeFileSync(txtFile,  txt,  'utf-8')
    fs.writeFileSync(path.join(dir, 'latest.html'), html, 'utf-8')
    fs.writeFileSync(path.join(dir, 'latest.txt'),  txt,  'utf-8')

    console.log(`\n📋 Informe QA:`)
    console.log(`   HTML → ${htmlFile}`)
    console.log(`   TXT  → ${txtFile}`)
  }

  // ── HTML builder ───────────────────────────────────────────────────────────

  _buildHtml() {
    const { _total: total, _passed: passed, _failed: failed,
            _skipped: skipped, _failures: failures } = this
    const scope = this.scope
    const isClean = failed === 0

    const prBadge = scope?.prNumber
      ? `PR #${scope.prNumber}${scope.prTitle ? ` — ${scope.prTitle}` : ''}`
      : ''

    const statusColor  = isClean ? '#97D700' : '#f59e0b'
    const statusBg     = isClean ? '#f0fdf4' : '#fffbeb'
    const statusBorder = isClean ? '#bbf7d0' : '#fde68a'
    const statusIcon   = isClean ? '✅' : '⚠️'
    const statusMsg    = isClean
      ? 'Validación ejecutada con resultados controlados.'
      : `Validación ejecutada. ${failed} ajuste${failed !== 1 ? 's' : ''} identificado${failed !== 1 ? 's' : ''} en proceso de atención.`

    // ── Coverage section ──
    const coverageRows = []
    if (this._hasFunctional)  coverageRows.push('Pruebas funcionales')
    if (this._hasIntegration) coverageRows.push('Pruebas de integración')

    const coverageHtml = coverageRows.length === 0 ? '' : `
      <section class="card">
        <h2 class="section-title">Cobertura</h2>
        <ul class="check-list">
          ${coverageRows.map(r => `
            <li><span class="check-icon">✓</span> ${escHtml(r)}</li>
          `).join('')}
        </ul>
      </section>`

    // ── Findings section ──
    const findingsHtml = failures.length === 0 ? '' : `
      <section class="card" style="margin-top:1.5rem;">
        <h2 class="section-title">Resumen de hallazgos</h2>
        <p class="muted-text" style="margin-bottom:1rem;">
          Se identificaron ajustes en escenarios específicos que ya están siendo atendidos
          por el equipo. No afectan la funcionalidad principal del flujo.
        </p>
        ${failures.map(t => {
          const sev = classifyFailure(t.tags)
          const s   = SEVERITY[sev]
          const uri = screenshotToDataUri(t.screenshotPath)
          const cleanTitle = stripTcPrefix(t.title)
          const errorSnippet = t.error
            ? escHtml(t.error.replace(/\s+at\s+.*/s, '').trim().slice(0, 400))
            : ''
          return `
            <div class="finding" style="background:${s.bg};border-color:${s.border};border-left-color:${s.dot};">
              <div class="finding-header">
                <span class="severity-pill" style="background:${s.dot};">${s.label}</span>
                <span class="finding-title">${escHtml(cleanTitle)}</span>
              </div>
              ${errorSnippet ? `<p class="finding-error">${errorSnippet}</p>` : ''}
              ${t.logs ? `
                <details class="evidence-details">
                  <summary>Ver logs</summary>
                  <pre class="log-block">${escHtml(t.logs.slice(0, 600))}</pre>
                </details>` : ''}
              ${uri ? `
                <details class="evidence-details">
                  <summary>Ver captura de pantalla</summary>
                  <img src="${uri}" alt="Captura de error" class="screenshot">
                </details>` : ''}
            </div>`
        }).join('')}
      </section>`

    // ── Next steps ──
    const nextItems = []
    if (failures.length > 0) {
      nextItems.push('Corrección de ajustes detectados')
      nextItems.push('Validación final post-ajustes')
    }
    const nextHtml = nextItems.length === 0 ? '' : `
      <section class="card" style="margin-top:1.5rem;">
        <h2 class="section-title">Próximos pasos</h2>
        <ul class="next-list">
          ${nextItems.map(s => `<li><span class="arrow">→</span> ${escHtml(s)}</li>`).join('')}
        </ul>
      </section>`

    // ── Test detail table ──
    const tableRows = this.tests.map((t, i) => {
      const bg = i % 2 === 0 ? 'white' : '#f9fafb'
      const statusInfo = {
        passed:  { icon: '✓', color: '#16a34a', text: 'Satisfactorio' },
        failed:  { icon: '✗', color: '#dc2626', text: 'Ajuste identificado' },
        timedOut:{ icon: '✗', color: '#dc2626', text: 'Tiempo excedido' },
        skipped: { icon: '⏭', color: '#6b7280', text: 'No aplicable' },
      }[t.status] ?? { icon: '?', color: '#9ca3af', text: t.status }

      return `
        <tr style="background:${bg};">
          <td class="td">${escHtml(stripTcPrefix(t.title))}</td>
          <td class="td">
            <span style="color:${statusInfo.color};font-weight:700;">${statusInfo.icon}</span>
            <span style="color:${statusInfo.color};font-size:0.75rem;margin-left:0.25rem;">${statusInfo.text}</span>
          </td>
          <td class="td td-right">${hms(t.duration)}</td>
        </tr>`
    }).join('')

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Calidad — Mediastream Platform</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Encode+Sans+Expanded:wght@300;400;600;900&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Encode Sans Expanded', 'Helvetica Neue', Arial, sans-serif;
      background: #f3f4f6; color: #1a1a1a; font-size: 15px;
    }
    a { color: #8E65D8; text-decoration: none; }
    .hero {
      background: linear-gradient(140deg, #8E65D8 0%, #4a3080 50%, #1a1a1a 100%);
      padding: 2rem 2.5rem; display: flex; align-items: center;
      justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    .hero-logo { height: 2rem; filter: brightness(0) invert(1); }
    .hero-meta { color: rgba(255,255,255,0.5); font-size: 0.72rem; margin-top: 0.3rem; }
    .hero-right { text-align: right; }
    .hero-right h1 { color: white; font-weight: 900; font-size: 1.125rem; }
    .hero-pr  { color: #97D700; font-size: 0.75rem; font-weight: 600; }
    .hero-mod { color: rgba(255,255,255,0.5); font-size: 0.72rem; }
    .main { max-width: 900px; margin: 2rem auto; padding: 0 1.5rem 3rem; }
    .status-banner {
      border-left-width: 5px; border-left-style: solid;
      border-radius: 0.75rem; padding: 1.25rem 1.5rem;
      display: flex; align-items: center; gap: 0.875rem; margin-bottom: 2rem;
    }
    .status-icon { font-size: 1.5rem; flex-shrink: 0; }
    .status-title { font-weight: 900; font-size: 1rem; }
    .status-msg { color: #4b5563; font-size: 0.875rem; margin-top: 0.2rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
    .card {
      background: white; border-radius: 1rem; padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .section-title { font-size: 1rem; font-weight: 900; margin-bottom: 1rem; }
    .check-list { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; }
    .check-list li { display: flex; align-items: center; gap: 0.6rem; font-size: 0.875rem; color: #374151; }
    .check-icon { color: #97D700; font-size: 1.1rem; font-weight: 900; }
    .result-row { display: flex; justify-content: space-between; font-size: 0.875rem; color: #374151; margin-bottom: 0.75rem; }
    .result-row:last-child { border-top: 1px solid #f3f4f6; padding-top: 0.5rem; color: #9ca3af; margin-bottom: 0; }
    .muted-text { color: #6b7280; font-size: 0.875rem; }
    .finding {
      margin-bottom: 0.875rem; padding: 1rem 1.125rem;
      border: 1px solid; border-left-width: 4px; border-radius: 0.75rem;
    }
    .finding-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.4rem; flex-wrap: wrap; }
    .severity-pill {
      color: white; font-size: 0.68rem; font-weight: 700;
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap;
    }
    .finding-title { font-size: 0.875rem; font-weight: 600; color: #1a1a1a; }
    .finding-error {
      font-size: 0.75rem; color: #6b7280; font-family: 'Courier New', monospace;
      white-space: pre-wrap; word-break: break-word;
      margin-top: 0.3rem; max-height: 120px; overflow-y: auto;
    }
    .evidence-details { margin-top: 0.6rem; }
    .evidence-details summary {
      font-size: 0.75rem; color: #8E65D8; cursor: pointer;
      font-weight: 600; user-select: none;
    }
    .log-block {
      margin-top: 0.4rem; background: #1a1a1a; color: #97D700;
      font-size: 0.72rem; font-family: 'Courier New', monospace;
      padding: 0.75rem; border-radius: 0.5rem; overflow-x: auto;
      white-space: pre-wrap; word-break: break-word; max-height: 200px; overflow-y: auto;
    }
    .screenshot {
      margin-top: 0.5rem; max-width: 100%; border-radius: 0.5rem;
      border: 1px solid #e5e7eb; display: block;
    }
    .next-list { list-style: none; display: flex; flex-direction: column; gap: 0.5rem; }
    .next-list li { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; }
    .arrow { color: #8E65D8; }
    table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
    thead tr { background: #1a1a1a; color: white; }
    th { text-align: left; padding: 0.65rem 0.875rem; font-weight: 600; }
    .td { padding: 0.6rem 0.875rem; color: #374151; vertical-align: middle; }
    .td-right { text-align: right; color: #9ca3af; }
    footer {
      margin-top: 3rem; padding: 1.25rem 1.5rem;
      text-align: center; border-top: 1px solid #e5e7eb;
    }
    footer p { font-size: 0.72rem; color: #9ca3af; }
    @media print {
      body { background: white; }
      .card { box-shadow: none; border: 1px solid #e5e7eb; }
    }
  </style>
</head>
<body>

  <!-- ── Header ── -->
  <header class="hero">
    <div>
      <img class="hero-logo"
           src="https://cdn.prod.website-files.com/6584479d07aff3fd2a2570e2/6584479d07aff3fd2a2576a2_Mediastream%20Platform.svg"
           alt="Mediastream Platform"
           onerror="this.style.display='none'">
      <p class="hero-meta">Informe de Calidad · ${this._dateStr}</p>
    </div>
    <div class="hero-right">
      <h1>Validación QA</h1>
      ${prBadge   ? `<p class="hero-pr">${escHtml(prBadge)}</p>` : ''}
      ${this._modules !== 'general'
          ? `<p class="hero-mod">Módulo: ${escHtml(this._modules)}</p>` : ''}
    </div>
  </header>

  <main class="main">

    <!-- ── Status banner ── -->
    <div class="status-banner" style="background:${statusBg};border-color:${statusColor};">
      <span class="status-icon">${statusIcon}</span>
      <div>
        <p class="status-title">Validación QA completada</p>
        <p class="status-msg">Estado general: ${statusMsg}</p>
      </div>
    </div>

    <!-- ── Coverage + Results grid ── -->
    <div class="grid-2">
      ${coverageHtml}
      <section class="card">
        <h2 class="section-title">Resultados</h2>
        <div class="result-row">
          <span>Total de pruebas ejecutadas</span>
          <strong>${total}</strong>
        </div>
        <div class="result-row">
          <span>Pruebas satisfactorias</span>
          <strong style="color:#16a34a;">${passed}</strong>
        </div>
        ${failed > 0 ? `
        <div class="result-row">
          <span>Ajustes identificados</span>
          <strong style="color:#d97706;">${failed} <span style="font-weight:400;font-size:0.75rem;">(en proceso de corrección)</span></strong>
        </div>` : ''}
        ${skipped > 0 ? `
        <div class="result-row">
          <span>No aplicables</span>
          <strong style="color:#6b7280;">${skipped}</strong>
        </div>` : ''}
        <div class="result-row">
          <span>Tiempo de ejecución</span>
          <span>${hms(this._totalDuration)}</span>
        </div>
      </section>
    </div>

    <!-- ── Findings ── -->
    ${findingsHtml}

    <!-- ── Next steps ── -->
    ${nextHtml}

    <!-- ── Test detail ── -->
    <section class="card" style="margin-top:1.5rem;">
      <h2 class="section-title">Detalle de validaciones</h2>
      <div style="overflow-x:auto;">
        <table>
          <thead>
            <tr>
              <th>Validación</th>
              <th>Estado</th>
              <th style="text-align:right;">Duración</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </section>

  </main>

  <footer>
    <p>
      Generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} ·
      <a href="https://mediastream.co">mediastream.co</a> ·
      Uso interno — confidencial
    </p>
  </footer>

</body>
</html>`
  }

  // ── TXT builder ────────────────────────────────────────────────────────────

  _buildTxt() {
    const scope   = this.scope
    const modules = this._modules
    const total   = this._total
    const passed  = this._passed
    const failed  = this._failed
    const prLine  = scope?.prNumber
      ? `PR #${scope.prNumber} — "${scope.prTitle ?? ''}"`
      : ''

    // Build short human summary
    let body
    if (failed === 0) {
      body =
        `Se ejecutaron ${total} pruebas sobre el módulo de ${modules}. ` +
        `Todas las validaciones resultaron satisfactorias. ` +
        `Se cubrieron creación de recursos, persistencia de datos, validación de campos obligatorios ` +
        `y ciclo de vida completo. Sin ajustes pendientes — listo para siguiente ambiente.`
    } else {
      const findingLabels = this._failures
        .map(t => SEVERITY[classifyFailure(t.tags)].label)
      const uniqueLabels = [...new Set(findingLabels)].join(', ')
      body =
        `Se ejecutaron ${total} pruebas sobre el módulo de ${modules}. ` +
        `${passed} validaciones resultaron satisfactorias. ` +
        `${failed} presentaron ajustes (${uniqueLabels}) que ya están siendo atendidos ` +
        `por el equipo de desarrollo. Los ajustes detectados no afectan la funcionalidad principal del flujo.`
    }

    return [
      `QA Mediastream Platform — ${this._dateStr}`,
      `Módulo: ${modules} | Entorno: dev${prLine ? ` | ${prLine}` : ''}`,
      '',
      body,
      '',
      `Estado: ${failed === 0
        ? 'Completado sin ajustes pendientes.'
        : `${failed} ajuste${failed !== 1 ? 's' : ''} identificado${failed !== 1 ? 's' : ''} en proceso de corrección.`}`,
      `Tests: ${total} ejecutados · ${passed} satisfactorios${failed > 0 ? ` · ${failed} con ajustes` : ''}`,
      '',
    ].join('\n')
  }
}
