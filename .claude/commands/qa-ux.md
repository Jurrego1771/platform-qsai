# /qa-ux — Pipeline UX/UI de Mediastream Platform

## Propósito

Audita la experiencia de usuario de un módulo o página del CMS SM2 usando las 10 heurísticas de Nielsen. Produce hallazgos con fixes Bootstrap 3 listos para implementar.

## Uso

```
/qa-ux [módulo|página]
```

Ejemplos:
- `/qa-ux` — audita todos los módulos (modo audit completo)
- `/qa-ux media` — audita el módulo de media
- `/qa-ux ads` — audita ads (revenue crítico, prioridad alta)
- `/qa-ux /customer/payments` — audita una página específica

## Pipeline de ejecución

Ejecuta los siguientes agentes en cadena. Lee el archivo de cada agente para obtener las instrucciones detalladas.

### Paso 1 — Scope (agents/shared/00-scope-analyzer.md)

Determinar qué páginas auditar basándose en el argumento del usuario.
Escribir resultado en `context/scope.json`.

### Paso 2 — Cargar Specialist

Leer `agents/specialists/<módulo>-specialist.md` para cargar conocimiento del dominio.

### Paso 3 — Page Crawler (agents/ux/02-page-crawler.md)

Usar Playwright MCP para navegar cada ruta del scope.
Para cada página: screenshot desktop/mobile + HTML + errores de consola.
Escribir resultado en `context/ux-crawl-results.json`.

### Paso 4 — Accessibility Checker (agents/ux/03-accessibility-checker.md)

Correr axe-core en cada página capturada.
Clasificar violaciones WCAG por severidad.
Escribir resultado en `context/accessibility-results.json`.

### Paso 5 — Heuristics Analyzer (agents/ux/04-heuristics-analyzer.md)

Analizar el HTML de cada página contra las 10 heurísticas de `criteria/nielsen-cms.md`.
Citar el número de heurística (H1-H10) para cada hallazgo.
Constraint: solo Bootstrap 3, sin nuevas dependencias.
Escribir resultado en `context/heuristic-findings.json`.

### Paso 6 — Proposal Generator (agents/ux/05-proposal-generator.md)

Para cada hallazgo, generar el Bootstrap 3 HTML de fix.
Estimar esfuerzo (xs/s/m/l).
Marcar revenue_impact si aplica.
Escribir resultado en `context/proposals.json`.

### Paso 7 — UX Reporter (agents/ux/06-ux-reporter.md)

Generar reporte final:
- `reports/baseline/UX_BASELINE.md` — resumen ejecutivo + tabla priorizada
- `reports/baseline/findings.json` — todos los hallazgos en JSON
- Mostrar top 5 hallazgos críticos al usuario en la conversación

### Paso 8 — Memory (agents/shared/99-memory-writer.md)

Persistir hallazgos en `memory/findings.json` y `memory/baselines.json`.

## Notas importantes

- **Bootstrap 3 only:** Nunca proponer React, Tailwind, ni nuevas dependencias
- **Revenue priority:** Si el scope incluye ads o customer, analizar esas páginas primero
- **Autenticación:** Si la plataforma requiere login, usar las credenciales del `.env`
- **Para rutas con :param:** Primero navegar al listing, extraer primer ID del DOM, luego visitar el detalle
