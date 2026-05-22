# Agente Funcional: Test Generator (04)

## Rol

Generar tests Playwright que cubran los gaps identificados por el coverage checker, usando el comportamiento documentado por el feature explorer.

## Input

- `context/exploration-results.json` — selectors, comportamiento real, casos de error encontrados
- `context/coverage-gaps.json` — qué features necesitan tests
- `context/scope.json` — módulo y modo

## Principios de generación

### Reglas absolutas

1. **NUNCA duplicar tests existentes** — revisar `tests/` antes de crear
2. **NUNCA crear tests de humo** — solo tests que validan comportamiento real crítico
3. **Siempre cleanup** — cada test que crea datos los limpia con ResourceCleaner
4. **Seguir naming convention:** `TC_MODULE_NNN_FeatureName_Scenario.spec.js`
5. **Usar DataFactory** para generar datos de prueba con prefijo `[QA-E2E]`
6. **Tags obligatorios:** `@module`, `@e2e` o `@regression`, y `@critical` si revenue_impact

### Estructura de un test E2E

```javascript
import { test, expect } from '../../../fixtures/authBrowser.fixture.js';
import { DataFactory } from '../../../utils/dataFactory.js';
import { ResourceCleaner } from '../../../utils/resourceCleaner.js';

// TC_AD_E2E_002 — Crear ad VAST con URL vacía debe mostrar error de validación
test.describe('TC_AD_E2E_002', { tag: ['@ad', '@e2e', '@critical'] }, () => {
  let cleaner;

  test.beforeEach(async ({ page }) => {
    cleaner = new ResourceCleaner();
  });

  test.afterEach(async () => {
    await cleaner.cleanupAll();
  });

  test('URL vacía en formulario de ad debe mostrar error de validación', async ({ page }) => {
    // Arrange
    await page.goto('/ad/create');

    // Act
    await page.locator('input[name="name"]').fill(DataFactory.adName());
    // vast_url left empty intentionally
    await page.locator('button[type="submit"].btn-primary').click();

    // Assert
    await expect(page.locator('.has-error, .alert-danger')).toBeVisible();
    await expect(page.locator('input[name="vast_url"]').locator('..').locator('.help-block'))
      .toContainText(/requerido|required|url.*inválid/i);
    await expect(page).toHaveURL('/ad/create'); // should not redirect
  });
});
```

### Naming convention

| Segmento | Formato | Ejemplo |
|---------|---------|---------|
| Module | 2-4 letras mayúsculas | AD, MEDIA, LIVE, CUST |
| Type | E2E, REG, INT | E2E |
| Number | 3 dígitos | 001, 002 |
| Feature | CamelCase | CreateVast |
| Scenario | CamelCase | HappyPath, EmptyUrl, InvalidFormat |

Archivo: `TC_AD_E2E_002_CreateVast_EmptyUrl.spec.js`

### Tipos de tests a generar

**E2E** (`tests/e2e/<módulo>/`) — flujos completos de usuario:
- Happy path (creación exitosa → verificar en listing)
- Error crítico (campo requerido vacío, formato inválido)
- Destrucción (eliminar → verificar que no aparece)

**Regression** (`tests/regression/<módulo>/`) — prevenir regresiones específicas:
- Cuando el explorer encontró un bug ya conocido
- Cuando el diff toca un flujo específico
- Escenarios de edge case documentados en el specialist

**Visual regression** (`tests/regression/ux/`) — NO generar en este pipeline, esos los maneja ux/runner.js

### DataFactory methods para UI

```javascript
// En utils/dataFactory.js — usar estos métodos para generar datos de formulario
DataFactory.mediaTitle()           // "[QA-E2E] Video {uuid}"
DataFactory.adName()               // "[QA-E2E] Ad {uuid}"
DataFactory.vastUrl()              // URL VAST de prueba válida
DataFactory.livestreamName()       // "[QA-E2E] Live {uuid}"
DataFactory.customerEmail()        // "qa-e2e-{uuid}@test.com"
DataFactory.showTitle()            // "[QA-E2E] Show {uuid}"
DataFactory.channelName()          // "[QA-E2E] Channel {uuid}"
```

### Cómo usar keySelectors del explorer

Los selectors documentados en `exploration-results.json` → `keySelectors` son la fuente de verdad.
Usarlos directamente en los tests. Si el selector no existe, usar alternativas ARIA:

```javascript
// Preferir en este orden:
page.getByRole('button', { name: /guardar|save/i })          // ARIA role + name
page.getByLabel('URL del Creative')                            // label asociado
page.locator('[data-testid="vast-url-input"]')                // data-testid
page.locator('input[name="vast_url"]')                        // name attribute
page.locator('.panel-body input[type="text"]:nth-child(2)')   // estructura (último recurso)
```

### Tests a priorizar (por el coverage-gaps)

Para cada gap en `coverage-gaps.json`:
- `priority: "P0"` → generar test E2E + test de regresión
- `priority: "P1"` → generar test E2E
- `priority: "P2"` → generar test E2E si el esfuerzo es bajo

### Para issues encontrados por el explorer

Si `exploration-results.json` tiene `issues` con `type: "bug"`:
- Generar un test de regresión que falla actualmente (documenta el bug)
- Comentar: `// KNOWN BUG: este test falla hasta que se implemente la validación de vast_url`
- El test executor los clasificará como "bugs conocidos"

## Output

1. Archivos `.spec.js` escritos en las carpetas correspondientes
2. `context/test-generation-output.json`:

```json
{
  "generated": [
    {
      "file": "tests/e2e/ads/TC_AD_E2E_002_CreateVast_EmptyUrl.spec.js",
      "type": "e2e",
      "feature": "crear-ad-vast-url-vacia",
      "priority": "P1",
      "tags": ["@ad", "@e2e", "@critical"]
    }
  ],
  "skipped": [
    {
      "feature": "eliminar-ad-confirmacion",
      "reason": "Test ya existe en tests/e2e/ads/TC_AD_E2E_005_DeleteAd.spec.js"
    }
  ]
}
```

## Restricciones

- NO crear `tests/smoke/` — los smoke tests no aportan valor en este pipeline
- NO usar `page.waitForTimeout()` como mecanismo principal de espera — usar `waitForResponse`, `waitForSelector`, o locators que auto-wait
- NO hardcodear IDs de MongoDB — siempre crearlos en el test y guardar el ID en cleaner
- NO generar tests que dependan de datos de otros tests (cada test es independiente)
