# /qa-functional-diff — Pipeline Funcional en Modo Diff

## Propósito

Igual que `/qa-functional` pero disparado por un PR o branch. Audita solo los módulos afectados por los cambios del PR.

## Uso

```
/qa-functional-diff [PR número | branch name]
```

Ejemplos:
- `/qa-functional-diff 187` — audita funcionalidad del PR #187
- `/qa-functional-diff feature/ads-vast-fix` — audita el branch

## Pipeline de ejecución

### Paso 1 — Diff Reader (agents/shared/01-diff-reader.md)

```bash
gh pr diff <N> --name-only
gh pr view <N> --json title,body,baseRefName
```
Mapear archivos a módulos con `criteria/module-map.md`.
También obtener el diff completo (primeros 10K chars) para contexto del cambio.
Escribir `context/scope.json` con `mode: "diff"` y `diffContent`.

### Paso 2 — Cargar Specialist(s)

Leer el specialist de cada módulo identificado.
Si es cambio global → cargar todos los specialists relevantes.

### Paso 3 — Coverage Checker (agents/functional/02-coverage-checker.md)

Mismo proceso que en modo audit, pero solo para los módulos del scope.

### Paso 4 — Feature Explorer (agents/functional/03-feature-explorer.md)

**Modo diff:** El explorer recibe el `diffContent` y se enfoca en las features específicas que cambiaron, no en una exploración completa del módulo.

Por ejemplo, si el diff toca `src/server/routes/ad/create.js`:
→ El explorer prueba específicamente el flujo de creación de ads
→ No prueba lista, detalle, ni eliminación (a menos que el diff también los toque)

### Paso 5 — Test Generator (agents/functional/04-test-generator.md)

Genera tests específicos para los flujos cambiados en el PR.
Preferir tests de regresión que prevengan que este bug/cambio se revierta.

### Paso 6 — Test Executor (agents/functional/05-test-executor.md)

Correr tests del módulo afectado + los nuevos tests generados.

### Paso 7 — Bug Reporter (agents/functional/06-bug-reporter.md)

**Modo diff:** El reporter tiene el contexto del diff.
Clasificar fallas considerando:
- ¿El stack trace apunta a código que cambió en este PR?  → Bug real en este PR
- ¿El test falló antes del PR también? → Pre-existing bug (informar, no bloquear)
- ¿Es un test nuevo que falla? → Posible bug real o test mal escrito

Output incluye recomendación:
- ✅ **Merge:** Tests pasan, no hay bugs nuevos
- ⚠️ **Merge con observaciones:** Tests pasan pero hay issues menores pre-existing
- ❌ **No merge:** Hay bugs nuevos introducidos por este PR

### Paso 8 — Memory (agents/shared/99-memory-writer.md)

Registrar PR en `memory/pr-history.json`.

## Formato de output para PR

```
## 🧪 QA Funcional — PR #187 "Fix ad VAST validation"

**Módulos afectados:** ads
**Revenue impact:** ⚠️ SÍ

### Tests ejecutados: 3 ✅ | 1 ❌ | 0 ⏭️

### ❌ Falla detectada

**Bug:** TC_AD_E2E_003 — VAST URL acepta URL vacía
**Severidad:** P1 (bloquea creación de ads funcionales)
**Steps para reproducir:**
1. Navegar a /ad → Crear ad
2. Dejar el campo "URL del creative" vacío
3. Click en Guardar
4. **Resultado:** El ad se guarda sin error

**Fix sugerido:** Agregar validación server-side en `src/server/routes/ad/create.js` y
validación client-side con `.has-error` en el campo del formulario.

**Revenue impact:** Ads sin creative URL no generan impresiones → pérdida directa de revenue.

### Recomendación: ❌ No merge hasta corregir P1
```
