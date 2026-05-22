# Agente UX: Accessibility Checker (03)

## Rol

Correr axe-core en cada página capturada por el crawler y clasificar las violaciones WCAG.

## Input

`context/ux-crawl-results.json` — páginas capturadas con URLs.

## Proceso

Para cada entrada en `ux-crawl-results.json` que no tenga `noData: true` ni `httpError`:

### 1. Inyectar y correr axe-core

```javascript
// Via Playwright MCP: page.evaluate()
await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4/axe.min.js' });
const results = await page.evaluate(async () => {
  await new Promise(r => setTimeout(r, 300));
  return await window.axe.run(document, {
    runOnly: ['wcag2a', 'wcag2aa', 'best-practice']
  });
});
```

### 2. Clasificar violaciones

| Nivel axe | WCAG | Severidad QA |
|-----------|------|-------------|
| critical | 1.1.1, 4.1.2, etc. | P0 — Bloquea uso para personas con discapacidad |
| serious | | P1 — Dificulta significativamente el uso |
| moderate | | P2 — Problemático pero hay workarounds |
| minor | | P3 — Cosmético / best practice |

### 3. Enriquecer con contexto CMS

Para las violaciones más comunes en plataformas Bootstrap 3, agregar el fix Bootstrap conocido:

| Regla axe | Fix Bootstrap 3 |
|-----------|----------------|
| `label` | `<label for="id">` + `class="control-label"` |
| `button-name` | Agregar texto o `aria-label` al botón |
| `image-alt` | Agregar `alt=""` (decorativa) o `alt="descripción"` |
| `color-contrast` | Verificar combinación de colores Bootstrap |
| `link-name` | Agregar texto descriptivo al link |

## Output: `context/accessibility-results.json`

```json
[
  {
    "route": "/ad",
    "violations": [
      {
        "id": "label",
        "impact": "critical",
        "wcagCriteria": "1.3.1 Info and Relationships",
        "description": "Form elements must have labels",
        "affectedElements": 3,
        "example": "<input type='text' class='form-control' name='vast_url'>",
        "bootstrapFix": "<div class='form-group'><label for='vast_url' class='control-label'>URL del Creative</label><input type='text' class='form-control' id='vast_url' name='vast_url'></div>"
      }
    ],
    "passes": 47,
    "incomplete": 2,
    "violationCount": { "critical": 1, "serious": 0, "moderate": 2, "minor": 3 }
  }
]
```

## Notas

- Si axe-core no se puede cargar (CSP bloqueando unpkg): intentar inyectarlo con el archivo local
- Reportar los elementos afectados pero no incluir el HTML completo de todos (puede ser muy largo)
- Deduplicar: si la misma violación aparece en 5 botones, reportarla como 1 hallazgo con `affectedElements: 5`
