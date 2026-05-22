# Agente: Memory Writer

## Rol

Último agente en ambos pipelines. Persiste los hallazgos y el estado aprendido en `memory/` para que futuras ejecuciones sean más informadas.

## Cuándo se ejecuta

Al final de cada pipeline, después de que el agente reporter (funcional o UX) ha generado su output.

## Qué persiste

### Del Pipeline Funcional

Lee `context/test-execution-results.json` y el reporte del bug-reporter para actualizar:

**`memory/findings.json`** — Agrega bugs nuevos:
```json
{
  "ads": {
    "lastAudit": "2026-05-22T10:30:00Z",
    "bugs": [
      {
        "id": "bug-ads-2026-05-22-001",
        "title": "VAST URL no validada en creación",
        "severity": "P1",
        "detectedBy": "e2e",
        "prNumber": 187,
        "resolved": false,
        "date": "2026-05-22"
      }
    ]
  }
}
```

**`memory/coverage.json`** — Actualiza los tests existentes:
```json
{
  "ads": {
    "current": {
      "e2e": 3,
      "regression": 1,
      "integration": 0
    },
    "tests": [
      "tests/e2e/ads/ad-vast-create.e2e.spec.js",
      "tests/e2e/ads/ad-vmap-create.e2e.spec.js",
      "tests/regression/ads/ad-assignment.regression.spec.js"
    ],
    "lastChecked": "2026-05-22T10:30:00Z"
  }
}
```

**`memory/pr-history.json`** — Agrega el PR analizado:
```json
{
  "prs": [
    {
      "prNumber": 187,
      "title": "Fix ad VAST validation",
      "date": "2026-05-22",
      "modules": ["ads"],
      "bugsFound": 1,
      "testsFailed": 2,
      "testsGenerated": 1,
      "merged": null
    }
  ]
}
```

### Del Pipeline UX

Lee `context/proposals.json` para actualizar:

**`memory/findings.json`** — Agrega issues UX:
```json
{
  "ads": {
    "lastAudit": "2026-05-22T10:30:00Z",
    "uxIssues": [
      {
        "id": "ux-ads-2026-05-22-001",
        "heuristic": "H3",
        "route": "/ad/:id",
        "severity": 3,
        "title": "Botón eliminar sin confirmación modal",
        "effort": "m",
        "revenueImpact": true,
        "status": "pending",
        "date": "2026-05-22"
      }
    ]
  }
}
```

**`memory/baselines.json`** — Actualiza el score de la vista:
```json
{
  "ads": {
    "status": "audited",
    "lastVerified": "2026-05-22",
    "uxScore": 72,
    "knownIssues": ["ux-ads-2026-05-22-001"]
  }
}
```

## Reglas de escritura

1. **Nunca sobreescribir** — Siempre hacer deep merge. Los bugs y UX issues se acumulan.
2. **Marcar resueltos** — Si en el PR actual se detecta que un bug anterior ya no existe, actualizar `"resolved": true, "resolvedDate": "..."` en lugar de eliminar.
3. **Deduplicar** — Si un bug tiene el mismo título y módulo que uno existente, actualizar el existente en vez de agregar duplicado.
4. **Fecha relativa → absoluta** — Siempre usar ISO 8601 (nunca "ayer", "esta semana").

## Sample IDs

Durante el pipeline, si el feature-explorer navegó a `/ad/:id` y obtuvo un ID real, guardarlo:

```json
{
  "ads": {
    "sampleIds": ["64abc123def456", "64abc999def000"]
  }
}
```

Estos IDs se usan en el próximo audit para resolver rutas paramétricas sin necesidad de navegar al listing primero.

## Mensaje al usuario

Al terminar, reportar brevemente qué se persistió:

```
✅ Memoria actualizada:
  - 1 bug nuevo en módulo ads
  - 2 UX issues en /ad y /ad/:id
  - Coverage de ads: 3 tests e2e
  - Sample IDs guardados: 2
```
