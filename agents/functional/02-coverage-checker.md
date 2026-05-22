# Agente Funcional: Coverage Checker (02)

## Rol

Determinar qué cobertura de tests existe para el módulo en scope y qué gaps hay que cubrir.

## Input

- `context/scope.json` — módulo, rutas y umbral de cobertura
- `memory/coverage.json` — historial de cobertura por módulo
- `tests/` — archivos de test existentes

## Proceso

### 1. Cargar umbral del módulo

Leer `context/scope.json` → `{ module, coverageThreshold, revenueImpact }`.

Ejemplo: ads → 80%, customer → 70%, resto → 60%.

### 2. Inventariar tests existentes

Buscar todos los archivos de test para el módulo:

```
tests/e2e/<módulo>/                    → tests E2E de flujos completos
tests/regression/<módulo>/             → tests de regresión
tests/integration/<módulo>/            → tests de integración
tests/regression/ux/                   → visual regression (compartido)
```

Para cada archivo encontrado, extraer:
- Nombre del test (comentario TC_MODULE_NNN o describe())
- Routes/features que cubre (inferir del nombre y contenido)
- Tags (@module @e2e @critical, etc.)
- Última ejecución exitosa (leer de `memory/coverage.json` → campo `tests`)

### 3. Comparar con features conocidas del specialist

El specialist del módulo define las features críticas que DEBEN tener cobertura.

**Para ads:**
- Crear ad VAST con URL válida ✓/✗
- Crear ad VAST con URL vacía (validación) ✓/✗
- Crear ad VAST con URL inválida (validación) ✓/✗
- Crear ad VMAP con breaks ✓/✗
- Verificar timing de VMAP ✓/✗
- Eliminar ad (con/sin confirmación) ✓/✗
- Asignar ad a media ✓/✗

**Para media:**
- Upload de video (happy path) ✓/✗
- Upload con título vacío (validación) ✓/✗
- Publicar video ✓/✗
- Despublicar video ✓/✗
- Editar metadata ✓/✗

**Para live:**
- Crear live stream ✓/✗
- Verificar credenciales RTMP generadas ✓/✗
- Cambiar estado (start/stop) ✓/✗

**Para customer:**
- Crear customer ✓/✗
- Aplicar access restriction ✓/✗
- Ver suscripción activa ✓/✗

### 4. Calcular cobertura estimada

```
cobertura = (features con al menos 1 test E2E) / (total features críticas del specialist)
```

Comparar con `coverageThreshold`.

### 5. Determinar si hay gaps

Un gap es una feature crítica sin ningún test E2E.

También marcar como gap:
- Tests que existen pero fallan consistentemente (ver `memory/coverage.json` → `failingTests`)
- Tests marcados como `.skip()` o `test.skip()`

### 6. Decidir si continuar al explorer

- Si cobertura >= umbral Y sin gaps críticos → `"hasGaps": false` → pipeline salta a Paso 6 (ejecutar tests)
- Si cobertura < umbral O hay gaps críticos → `"hasGaps": true` → pipeline continúa a Paso 4 (explorer)

## Output: `context/coverage-gaps.json`

```json
{
  "module": "ads",
  "coverageThreshold": 80,
  "estimatedCoverage": 45,
  "revenueImpact": true,
  "hasGaps": true,
  "existingTests": [
    {
      "file": "tests/e2e/ads/TC_AD_E2E_001_CreateVast_HappyPath.spec.js",
      "features": ["crear-ad-vast-url-valida"],
      "tags": ["@ad", "@e2e", "@critical"],
      "lastPassed": "2026-05-20"
    }
  ],
  "gaps": [
    {
      "feature": "crear-ad-vast-url-vacia",
      "type": "e2e",
      "priority": "P1",
      "reason": "No existe test que valide el rechazo de URL vacía en el formulario"
    },
    {
      "feature": "crear-ad-vmap-breaks",
      "type": "e2e",
      "priority": "P2",
      "reason": "VMAP no tiene cobertura de ningún tipo"
    }
  ],
  "skippedTests": []
}
```

## Notas

- Si `tests/` no existe o está vacío → `estimatedCoverage: 0`, todos los features son gaps
- No contar tests de `api_test_flow` (esos son de API, no de UI/E2E de plataforma)
- Leer `memory/coverage.json` antes de reportar — puede tener datos de ejecuciones anteriores
- Si el módulo tiene `revenueImpact: true`, marcar todos los gaps de creación como `priority: "P1"`
