# /qa-functional — Pipeline Funcional en Modo Audit

## Propósito

Auditar la funcionalidad de un módulo de la plataforma Mediastream CMS. Explora features con Playwright MCP, verifica cobertura de tests, genera los tests faltantes, los ejecuta, y reporta bugs.

## Uso

```
/qa-functional [módulo]
/qa-functional [módulo/feature específica]
```

Ejemplos:
- `/qa-functional ads` — audita el módulo completo de ads
- `/qa-functional media` — audita el módulo de media
- `/qa-functional live` — audita livestreams
- `/qa-functional customer` — audita clientes y subscripciones

## Pipeline de ejecución

### Paso 1 — Scope Analyzer (agents/shared/00-scope-analyzer.md)

Determinar qué auditar: módulo, rutas, specialist asignado.
Escribir `context/scope.json`.

### Paso 2 — Cargar Specialist

Leer `agents/specialists/<módulo>-specialist.md`.
Este archivo provee:
- Features conocidas del módulo
- Flujos críticos (happy path + error cases)
- Patrones de falla conocidos
- Herramientas disponibles (ffmpeg, vast-validate, etc.)
- Definición de "funciona correctamente"

### Paso 3 — Coverage Checker (agents/functional/02-coverage-checker.md)

¿Qué tests ya existen? ¿Qué falta?
Leer `memory/coverage.json` para historial.
Comparar contra umbral del specialist.
Escribir `context/coverage-gaps.json`.

Si no hay gaps → saltar al Paso 6 (ejecutar tests existentes).

### Paso 4 — Feature Explorer (agents/functional/03-feature-explorer.md)

Solo si hay gaps en cobertura.
Explorar el módulo con Playwright MCP como un tester humano.
Documentar features, estados, validaciones y comportamientos de error.
Escribir `context/exploration-results.json`.

### Paso 5 — Test Generator (agents/functional/04-test-generator.md)

Solo si hay gaps.
Generar tests Playwright para los gaps identificados.
Escribir archivos en `tests/e2e/<módulo>/` o `tests/regression/`.
Escribir `context/test-generation-output.json`.

### Paso 6 — Test Executor (agents/functional/05-test-executor.md)

Correr tests del módulo (existentes + nuevos si aplica).
Capturar resultados completos con stack traces.
Escribir `context/test-execution-results.json`.

### Paso 7 — Bug Reporter (agents/functional/06-bug-reporter.md)

Clasificar fallas: ¿bug real en código SM2? ¿test defectuoso?
Para bugs reales: generar issue con steps, stack trace, fix sugerido.
Para tests defectuosos: proponer corrección.

### Paso 8 — Memory (agents/shared/99-memory-writer.md)

Persiste hallazgos en `memory/findings.json`.
Actualiza `memory/coverage.json` con nuevos tests.

## Umbrales de cobertura por módulo

| Módulo | Umbral | Revenue Critical |
|--------|--------|-----------------|
| ads | 80% | Sí |
| customer | 70% | Sí |
| media | 60% | No |
| live | 60% | Parcial |
| analytics | 60% | No |
| channel | 60% | No |
| show | 60% | No |
| platform | 60% | No |

## Formato de output final

```
## 🧪 QA Funcional — [Módulo] — [fecha]

**Módulo:** [módulo] [(⚠️ revenue impact) si aplica]
**Cobertura:** [actual]% / [umbral]% requerido

### Tests ejecutados: [N] ✅ | [N] ❌ | [N] ⏭️

[Si hay bugs:]
### ❌ Bugs detectados

**Bug:** [TC_MODULE_NNN — nombre]
**Severidad:** [P0/P1/P2]
**Steps:**
1. ...

**Fix sugerido:** [descripción con archivo de código si aplica]
**Revenue impact:** [sí/no + explicación]

[Si no hay bugs:]
### ✅ Sin bugs detectados en esta auditoría

### Cobertura generada

[Lista de tests nuevos escritos, si aplica]

### Recomendación

[Acción a tomar]
```
