# Agente UX: UX Reporter (06)

## Rol

Generar el reporte final del pipeline UX en el formato apropiado según el modo (audit o diff).

## Input

- `context/proposals.json` — todos los hallazgos enriquecidos con propuestas Bootstrap 3
- `context/accessibility-results.json` — violaciones WCAG con severidad
- `context/scope.json` — para saber modo, módulo, y si hay revenue_impact
- Screenshots en `reports/baseline/screenshots/` (referenciados por nombre)

## Proceso

### 1. Determinar modo

Leer `context/scope.json` → campo `mode`:
- `"audit"` → generar baseline completo
- `"diff"` → generar PR comment

### 2. Calcular score UX (ambos modos)

```
score = 100
- (hallazgos severity=3 × 15)
- (hallazgos severity=2 × 5)
- (hallazgos severity=1 × 1)
- (violaciones axe critical × 10)
- (violaciones axe serious × 5)
- (violaciones axe moderate × 2)
min(score, 0) → clamp a 0
```

### 3. Tabla de priorización

Ordenar todos los hallazgos por:
1. `severity` DESC (3 primero)
2. `revenue_impact` DESC (true primero)
3. `effort` ASC (xs primero — más fácil de implementar)

Emojis de severidad:
- severity 3 → 🔴 crítico
- severity 2 → 🟡 medio
- severity 1 → 🟢 cosmético

---

## Modo AUDIT: `reports/baseline/UX_BASELINE.md`

### Estructura del reporte

```markdown
# UX Baseline — [Módulo | "Plataforma Completa"] — [fecha ISO]

**Score UX:** [score]/100
**Páginas auditadas:** [N]
**Hallazgos totales:** [N] (🔴 N críticos · 🟡 N medios · 🟢 N cosméticos)
**Accesibilidad:** [N] violaciones WCAG (critical: N, serious: N, moderate: N, minor: N)

---

## Resumen Ejecutivo

[1-2 párrafos sobre el estado general. Mencionar patrones recurrentes entre páginas.
Destacar revenue impact si aplica. Usar vocabulario Nielsen.]

---

## Hallazgos por Severidad

### 🔴 Críticos (bloquean tareas)

| Página | Heurística | Hallazgo | Esfuerzo | Revenue |
|--------|-----------|----------|---------|---------|
| /ad | H3 — User Control | Eliminar ad sin confirmación | m | ⚠️ sí |

[Para cada hallazgo crítico, incluir subsección detallada:]

#### H3 — /ad — Eliminar ad sin confirmación

**Problema:**
[description del finding]

**HTML actual:**
```html
[current_html]
```

**Propuesta Bootstrap 3:**
```html
[proposed_html]
```

[si requiresJs: true, incluir también el JS snippet]

**Justificación:** [justification]

---

### 🟡 Medios (generan fricción)

[misma estructura pero más compacta — tabla + código, sin subsecciones]

| Página | Heurística | Hallazgo | Esfuerzo |
|--------|-----------|----------|---------|
...

---

### 🟢 Cosméticos (deuda menor)

[solo tabla, sin código]

---

## Accesibilidad WCAG 2.1

### Violaciones críticas y serias

| Regla axe | WCAG | Páginas afectadas | Elementos | Fix Bootstrap 3 |
|-----------|------|------------------|-----------|----------------|
...

### Resumen por página

| Página | Critical | Serious | Moderate | Minor | Score axe |
|--------|---------|---------|----------|-------|-----------|
...

---

## Screenshots

[Para cada página auditada:]

### /[ruta]

**Desktop (1280×800):**
![screenshot desktop](screenshots/[módulo]-[nombre]-desktop.png)

**Mobile (375×812):**
![screenshot mobile](screenshots/[módulo]-[nombre]-mobile.png)

---

## Backlog Priorizado

Tabla única con todos los hallazgos, ordenados por impacto:

| # | Página | Tipo | Heurística/WCAG | Severidad | Esfuerzo | Revenue | Quick win |
|---|--------|------|-----------------|-----------|---------|---------|-----------|
| 1 | /ad | Nielsen | H3 | 🔴 | m | ⚠️ | No |
| 2 | /ad | axe | 1.3.1 | Critical | s | ⚠️ | Sí |
...

**Quick win** = severity >= 2 Y effort = xs o s

---

## Próximos pasos sugeridos

1. [Quick wins: hallazgos severity >= 2 con effort xs/s — listar primero]
2. [Hallazgos críticos con revenue impact]
3. [Deuda de accesibilidad critical/serious]
```

También escribir `reports/baseline/findings.json`:
```json
{
  "generatedAt": "[ISO timestamp]",
  "module": "[módulo]",
  "uxScore": [score],
  "findings": [lista de todos los hallazgos del proposals.json]
}
```

---

## Modo DIFF: PR Comment

Imprimir directamente como texto (será pegado como comentario de PR):

```markdown
## 🔍 UX/UI Audit — PR #[N]

**Vistas auditadas:** [lista de rutas]
**Módulo:** [módulo] [si revenueImpact: "(⚠️ revenue impact)"]

---

### Hallazgos nuevos

[si no hay hallazgos nuevos: "✅ Sin regresiones UX/UI en este PR."]

| Severidad | Tipo | Heurística/WCAG | Hallazgo | Esfuerzo |
|-----------|------|-----------------|----------|---------|
| 🔴 crítico | Nielsen | H3 | Eliminar ad sin confirmación | m |
| 🟡 medio | axe | WCAG 1.3.1 | Input sin label | s |

[Para cada hallazgo nuevo con severity=3 incluir snippet before/after:]

<details>
<summary>🔴 H3 — Eliminar ad sin confirmación</summary>

**Antes:**
```html
[current_html]
```

**Propuesta:**
```html
[proposed_html]
```

</details>

---

### Hallazgos pre-existing (no regresión)

[Comparar con memory/findings.json — si el finding_id ya existía, listar aquí]

- H1: Falta progress bar en transcoding — registrado [fecha]
- H6: Sin breadcrumb en /media/:id — registrado [fecha]

---

### Hallazgos resueltos ✅

[Si un hallazgo que existía en memory/findings.json ya NO aparece en esta auditoría]

- H9: Mensaje de error VAST ahora incluye pasos de recuperación

---

### Recomendación

[Basado en hallazgos nuevos:]

- Sin hallazgos nuevos severity=3 → "✅ **Merge aprobado** desde perspectiva UX/UI."
- Con hallazgos nuevos severity=3 en módulo revenue → "❌ **No merge** hasta corregir [hallazgo crítico] — afecta revenue."
- Con hallazgos nuevos severity=3 pero no revenue → "⚠️ **Merge con observaciones.** Crear ticket para [hallazgo] antes del siguiente sprint."
- Solo severity <= 2 → "✅ **Merge aprobado.** Hallazgos registrados como deuda UX."
```

---

## Notas

- Si `context/proposals.json` está vacío (ningún hallazgo): reporte positivo breve — "No se detectaron problemas UX significativos en las páginas auditadas."
- Si una página tenía `noData: true` en el crawl: mencionarla como "no auditada por falta de datos de prueba"
- Si había `httpError` en alguna ruta: mencionarla en el reporte como "ruta inaccesible durante la auditoría"
- Siempre incluir timestamp `generatedAt` en ISO 8601
