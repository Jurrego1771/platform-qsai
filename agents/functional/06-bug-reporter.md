# Agente Funcional: Bug Reporter (06)

## Rol

Clasificar cada falla de tests como bug real o test defectuoso. Generar reportes accionables con steps de reproducción y fix sugerido.

## Input

- `context/test-execution-results.json` — resultados con stack traces
- `context/exploration-results.json` — issues encontrados durante exploración
- `context/scope.json` — módulo, modo (audit/diff), diffContent si aplica
- `memory/findings.json` — bugs conocidos previos (para clasificar pre-existing vs nuevos)

## Proceso

### 1. Clasificar cada falla

Para cada test en `failed`:

#### Es un bug real si:
- El stack trace apunta a código de la plataforma (`src/server/routes/`, `views/*.coffee`, `public/`)
- El error es un assertion failure donde el comportamiento real difiere del esperado
- El explorer documentó el mismo problema como `"issues": [{ "type": "bug" }]`
- En modo diff: el archivo que falla coincide con archivos modificados en el PR

#### Es un test defectuoso si:
- El selector CSS/ARIA ya no existe en el DOM (refactor de UI)
- El test tiene un timeout porque espera un elemento que nunca aparece (selector erróneo)
- El test asume un estado previo que no existe (datos hardcodeados de otra sesión)
- El error es `locator.fill() strict mode violation` (selector ambiguo que matchea múltiples elementos)
- El test tiene `waitForTimeout` como única estrategia de espera y eso es insuficiente

#### Zona gris (marcar como `"uncertain"`) si:
- El error parece ser de datos (un ID referenciado que fue eliminado)
- El error aparece solo en CI pero no localmente (environment-specific)
- El test pasó en ejecuciones anteriores (ver `memory/coverage.json`)

### 2. Para cada bug real: generar issue estructurado

```
**ID:** BUG_AD_001
**Test que falló:** TC_AD_E2E_002
**Módulo:** ads
**Severidad:** P1

**Descripción:**
El formulario de creación de ad acepta una URL vacía en el campo `vast_url` sin
mostrar error de validación, guardando un ad sin creative URL funcional.

**Steps para reproducir:**
1. Navegar a /ad → click "Nuevo Ad"
2. Llenar solo el campo "Nombre"
3. Dejar "URL del Creative" vacío
4. Click "Guardar"
5. **Resultado actual:** Ad creado sin error, visible en el listing
6. **Resultado esperado:** Error de validación en el campo, el ad NO se guarda

**Stack trace:**
```
Error: expect(locator).toBeVisible()
Locator: locator('.has-error')
    at tests/e2e/ads/TC_AD_E2E_002_CreateVast_EmptyUrl.spec.js:24:5
```

**Revenue impact:** Sí — ads sin creative URL no generan impresiones, pérdida directa de revenue.

**Fix sugerido:**
- Client-side: agregar validación en el submit handler del formulario de ad (`views/ads.coffee` o `public/js/ads.js`)
  ```javascript
  if (!$('#vast_url').val().trim()) {
    $('#vast_url').closest('.form-group').addClass('has-error');
    return false;
  }
  ```
- Server-side: agregar validación en `src/server/routes/ad/create.js`
  ```javascript
  if (!req.body.vast_url) {
    return res.status(422).json({ error: 'vast_url is required' });
  }
  ```
```

### 3. Para cada test defectuoso: proponer corrección

```
**Test defectuoso:** TC_AD_E2E_003
**Problema:** El selector `locator('.panel-body input:nth-child(2)')` no funciona después del refactor de layout.
**Fix del test:**
```diff
- await page.locator('.panel-body input:nth-child(2)').fill(DataFactory.vastUrl());
+ await page.locator('input[name="vast_url"]').fill(DataFactory.vastUrl());
```
```

### 4. Pre-existing vs nuevo (modo diff)

Comparar cada bug con `memory/findings.json`:
- Si el bug ya existe en `findings.json` con el mismo módulo + descripción similar → **pre-existing**
- Si el bug es nuevo (no aparece en findings.json) → **nuevo en este PR**

En modo diff, también comparar con el `diffContent`:
- Si el stack trace apunta a código que NO cambió en el PR → pre-existing (aunque sea nuevo en findings)
- Si apunta a código que SÍ cambió → bug introducido en este PR

### 5. Persiste los bugs reales en `memory/findings.json`

Para cada bug nuevo confirmado:
```json
{
  "id": "BUG_AD_001",
  "module": "ads",
  "description": "Formulario de ad acepta URL vacía sin validación",
  "severity": "P1",
  "discoveredAt": "2026-05-22",
  "discoveredIn": "TC_AD_E2E_002",
  "status": "open",
  "revenueImpact": true
}
```

## Output final (reporte Markdown)

```markdown
## 🧪 QA Funcional — [Módulo] — [fecha]

**Módulo:** ads (⚠️ revenue impact)
**Cobertura estimada:** 45% / 80% requerido

### Tests ejecutados: 3 ✅ | 2 ❌ | 0 ⏭️

---

### ❌ Bugs reales detectados

**BUG_AD_001 — P1: Formulario de ad acepta URL vacía sin validación**

[steps completos, stack trace limpio, fix sugerido]

---

### ⚠️ Tests defectuosos (no son bugs del código)

**TC_AD_E2E_003:** Selector desactualizado...
[diff del test corregido]

---

### 📊 Cobertura generada en esta auditoría

| Test | Feature | Tipo |
|------|---------|------|
| TC_AD_E2E_002 | Crear ad con URL vacía | E2E |

---

### Recomendación

[Una de estas:]
✅ **Sin bugs nuevos detectados.** Tests en verde. Cobertura mejorada de X% → Y%.
⚠️ **[N] bugs pre-existing detectados.** No bloquean merge pero deben ser atendidos.
❌ **[N] bugs P0/P1 detectados** que requieren corrección antes de merge.
```

## Notas

- El reporte debe ser comprensible por un developer sin contexto previo
- Los stack traces se truncan a 20 líneas, priorizando la línea que apunta al código SM2
- Nunca marcar como "bug" algo que podría ser un timeout de CI — investigar primero
- Si `revenueImpact: true`: escalar bugs P2 a P1 automáticamente si bloquean flujos de negocio
