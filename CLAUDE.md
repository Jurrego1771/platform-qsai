# Platform-QSAI — Hub de QA para Mediastream Platform SM2

## Propósito

Sistema de QA multi-agente para el CMS SM2 de Mediastream. Dos pipelines distintos:
- **QA Funcional** (`/qa-functional`, `/qa-functional-diff`) — valida que la plataforma funciona correctamente
- **QA UX/UI** (`/qa-ux`, `/qa-ux-diff`) — valida que la experiencia de usuario cumple estándares profesionales

Ambos pipelines tienen modo **audit** (exploración completa) y modo **diff** (solo lo que cambió en un PR).

## Repositorios relacionados

- `D:\repos\mediastream\sm2` — El CMS auditado (Node.js/Express, CoffeeScript, Bootstrap 3)
- `D:\repos\jurrego1771\api_test_flow` — Suite de tests API (NO duplicar, complementaria)
- `D:\repos\jurrego1771\ux-sm2` — Auditor UX anterior (migrado aquí en `ux/`)

## Estructura de agentes

```
agents/
├── shared/           # Agentes compartidos por ambos pipelines
│   ├── 00-scope-analyzer.md    # Determina qué auditar
│   ├── 01-diff-reader.md       # Lee gh pr diff → módulos afectados
│   └── 99-memory-writer.md     # Persiste hallazgos al final
├── functional/       # Pipeline funcional (02 → 06)
├── ux/               # Pipeline UX (02 → 06)
└── specialists/      # Conocimiento de dominio por módulo
```

## Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `/qa-functional [módulo]` | Audita funcionamiento de un módulo |
| `/qa-functional-diff [PR#]` | Audita funcionamiento de lo que cambió |
| `/qa-ux [módulo\|página]` | Audita UX/UI de un módulo |
| `/qa-ux-diff [PR#\|branch]` | Audita UX/UI de lo que cambió |
| `/redesign-proposal [módulo]` | Genera mockups HTML modernos con branding oficial |
| `/mediastream-brand` | Consultar guía de marca (colores, tipografía, logo) |

## Context flow

Los agentes se comunican via archivos JSON en `context/`:
```
context/scope.json → coverage-gaps.json → exploration-results.json 
→ test-generation-output.json → test-execution-results.json
→ ux-crawl-results.json → accessibility-results.json
→ heuristic-findings.json → proposals.json
```

## Variables de entorno requeridas

```bash
BASE_URL=           # URL de la plataforma SM2
CMS_USER=           # Email del usuario QA
CMS_PASSWORD=       # Password del usuario QA
SM2_API_TOKEN=      # Token X-API-Token para llamadas API
ACCOUNT_ID=         # Account ID de SM2
```

## Tests

Los tests Playwright viven en `tests/` y son independientes de `api_test_flow`:
- `tests/e2e/` — Flujos E2E de usuario en browser
- `tests/regression/` — Tests de regresión (incluye visual)
- `tests/integration/` — Features con dependencias entre módulos

```bash
npm run test:e2e          # Todos los E2E
npm run test:ad           # Solo módulo ads
npm run ux:audit          # Auditoría UX completa autónoma
```

## Módulos y umbrales de cobertura

| Módulo | Revenue Impact | Umbral |
|--------|---------------|--------|
| ads | Sí (crítico) | 80% |
| customer | Sí (crítico) | 70% |
| live | Parcial | 60% |
| media | No | 60% |
| show | No | 60% |
| channel | No | 60% |
| analytics | No | 60% |

## Convención de naming para tests

Igual que `api_test_flow`:
- `TC_MEDIA_E2E_001_UploadVideo_HappyPath`
- Tags: `@media @e2e @critical`
- Archivos: `[módulo]-[feature].e2e.spec.js`

## Auth

`global-setup.js` (en `ux/flows/`) hace login y guarda la sesión en `.auth/user.json`.
Todos los tests reusan esa sesión. Para re-autenticar: eliminar `.auth/user.json` y reiniciar.
