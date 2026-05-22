# Agente Funcional: Test Executor (05)

## Rol

Ejecutar los tests Playwright del módulo y capturar los resultados completos con stack traces.

## Input

- `context/test-generation-output.json` — tests nuevos generados (puede estar vacío si no hubo gaps)
- `context/scope.json` — módulo

## Proceso

### 1. Determinar qué tests correr

**Tests existentes del módulo:**
```
tests/e2e/<módulo>/
tests/regression/<módulo>/
```

**Tests nuevos** (si `test-generation-output.json` tiene archivos):
Los archivos ya están escritos en las carpetas correspondientes — el comando los incluye automáticamente.

### 2. Ejecutar tests con Playwright

Usar Bash para ejecutar:

```bash
# E2E del módulo
npx playwright test tests/e2e/<módulo>/ --reporter=json --output=context/test-results-e2e.json 2>&1

# Regression del módulo
npx playwright test tests/regression/<módulo>/ --reporter=json --output=context/test-results-regression.json 2>&1
```

Si el módulo tiene `revenueImpact: true`, correr también con retries=0 para detectar flaky tests:
```bash
npx playwright test tests/e2e/<módulo>/ --reporter=json --retries=0 --output=context/test-results-no-retry.json 2>&1
```

### 3. Capturar output completo

Capturar STDOUT + STDERR completo. Los stack traces son esenciales para el bug reporter.

### 4. Parsear resultados JSON de Playwright

El output JSON tiene esta estructura:
```json
{
  "stats": { "expected": N, "unexpected": N, "skipped": N },
  "suites": [
    {
      "title": "TC_AD_E2E_001",
      "specs": [
        {
          "title": "URL vacía debe mostrar error",
          "ok": false,
          "tests": [{
            "results": [{
              "status": "failed",
              "error": { "message": "...", "stack": "..." },
              "duration": 5432
            }]
          }]
        }
      ]
    }
  ]
}
```

### 5. Si Playwright no está instalado o los tests no corren

Si `npx playwright test` falla con error de setup:
1. Verificar que `node_modules/` existe → si no: `npm install`
2. Verificar que `.auth/user.json` existe → si no: correr `node ux/flows/global-setup.js`
3. Verificar que `BASE_URL` está en `.env`
4. Si sigue fallando: reportar el error como blocker en el output

### 6. Interpretar resultados

Para cada test fallido, extraer:
- Nombre completo del test (TC_MODULE_NNN + describe)
- Mensaje de error
- Stack trace (primeras 20 líneas)
- Duración (para identificar timeouts vs fallos rápidos)
- Screenshot de Playwright si existe (en test-results/)

## Output: `context/test-execution-results.json`

```json
{
  "module": "ads",
  "executedAt": "2026-05-22T10:30:00Z",
  "summary": {
    "total": 5,
    "passed": 3,
    "failed": 2,
    "skipped": 0,
    "duration": 45234
  },
  "passed": [
    {
      "id": "TC_AD_E2E_001",
      "title": "Crear ad VAST con URL válida — happy path",
      "duration": 8234
    }
  ],
  "failed": [
    {
      "id": "TC_AD_E2E_002",
      "title": "URL vacía en formulario de ad debe mostrar error de validación",
      "error": "expect(locator).toBeVisible()\n\nLocator: locator('.has-error')\nExpected: visible\nReceived: hidden",
      "stackTrace": "Error: Timed out 5000ms waiting for expect(locator).toBeVisible()\n    at /tests/e2e/ads/TC_AD_E2E_002_CreateVast_EmptyUrl.spec.js:24:5",
      "duration": 5432,
      "screenshotPath": "test-results/TC_AD_E2E_002-failed.png",
      "isNewTest": true
    }
  ],
  "skipped": [],
  "executionErrors": []
}
```

## Notas

- Si un test individual tarda más de 60s → registrar como `"timeout": true`
- Si todos los tests fallan con el mismo error de auth → abortar y reportar como `"authFailure": true`
- NO reintentar tests fallidos manualmente — el bug reporter los analiza tal como llegaron
- Los tests que pasan en el primer intento pero fallan en el segundo son "flaky" — marcarlos con `"flaky": true`
