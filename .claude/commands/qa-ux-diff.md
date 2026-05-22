# /qa-ux-diff — Pipeline UX/UI en Modo Diff

## Propósito

Igual que `/qa-ux` pero disparado por un PR o branch. Solo audita las páginas afectadas por los cambios del PR. Produce output formateado como PR comment.

## Uso

```
/qa-ux-diff [PR número | branch name]
```

Ejemplos:
- `/qa-ux-diff 187` — audita las vistas del PR #187
- `/qa-ux-diff feature/ads-update` — audita las vistas del branch

## Pipeline de ejecución

### Paso 1 — Diff Reader (agents/shared/01-diff-reader.md)

Obtener archivos cambiados:
```bash
gh pr diff <N> --name-only
```
Mapear a módulos usando `criteria/module-map.md`.
Escribir `context/scope.json` con `mode: "diff"`.

### Paso 2 — Cargar Specialist

Leer `agents/specialists/<módulo>-specialist.md` para cada módulo identificado.

### Paso 3 — Page Crawler (agents/ux/02-page-crawler.md)

Igual que en modo audit, pero SOLO las rutas del scope.
Si el scope es vacío (ningún archivo mapea a vistas): notificar al usuario que el PR no toca UI.

### Paso 4 — Accessibility Checker (agents/ux/03-accessibility-checker.md)

Correr axe-core en las páginas capturadas.

### Paso 5 — Heuristics Analyzer (agents/ux/04-heuristics-analyzer.md)

Analizar HTML contra Nielsen. Mismo proceso que audit.

### Paso 6 — Proposal Generator (agents/ux/05-proposal-generator.md)

Generar fixes Bootstrap 3.
**Comparar con `memory/findings.json`:**
- Si el hallazgo ya existía antes del PR: es un `pre-existing` (informar pero no bloquear)
- Si el hallazgo es nuevo en esta vista: es un `new` (marcar como regresión)
- Si un hallazgo existente ya no está: es un `resolved` (celebrar)

### Paso 7 — UX Reporter (agents/ux/06-ux-reporter.md)

Generar output como **PR comment** (no como baseline):

```markdown
## 🔍 UX/UI Audit — PR #187

**Vistas auditadas:** /ad, /ad/:id
**Módulo:** ads (⚠️ revenue impact)

### Hallazgos nuevos

| Severidad | Heurística | Hallazgo | Esfuerzo |
|-----------|------------|----------|---------|
| 🔴 alto | H3 — User Control | Eliminar ad sin modal de confirmación | m |
| 🟡 medio | H9 — Error Recovery | Mensaje de VAST inválido sin pasos de solución | s |

### Hallazgos existentes (pre-existing, no regresión)
- H1: Falta progress bar en upload — ya registrado

### Recomendación
⚠️ Merge con observaciones. Corregir H3 antes de merge (severidad crítica en módulo de revenue).
```

### Paso 8 — Memory (agents/shared/99-memory-writer.md)

Actualizar `memory/pr-history.json` con el PR analizado.

## Diferencias clave con /qa-ux

| Aspecto | /qa-ux | /qa-ux-diff |
|---------|--------|-------------|
| Scope | Módulo completo o todos | Solo vistas del PR |
| Output | UX_BASELINE.md + findings.json | PR comment format |
| Comparación | vs baseline anterior | vs memory/findings.json |
| Recomendación | Backlog priorizado | Merge / No merge |
