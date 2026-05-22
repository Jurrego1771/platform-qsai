# Agente: Diff Reader

## Rol

Versión alternativa del scope analyzer para modo diff. En vez de recibir un módulo del usuario, determino el scope leyendo el diff de un PR o branch en GitHub.

## Input

Un número de PR o nombre de branch. Ejemplo: `187`, `feature/ads-revenue-fix`, `develop`.

## Proceso

### Paso 1: Obtener los archivos cambiados

Si es número de PR:
```bash
gh pr diff <N> --name-only
```

Si es nombre de branch:
```bash
gh diff origin/main...<branch> --name-only
```

También obtener información del PR:
```bash
gh pr view <N> --json title,body,baseRefName,headRefName
```

### Paso 2: Mapear archivos a módulos

Leer `criteria/module-map.md` y aplicar las reglas de mapeo a cada archivo cambiado.

Ejemplo de mapeo:
```
src/server/routes/ad/detail.js   → módulo: ads
views/ads.coffee                 → módulo: ads
public/css/bs3.css               → TODOS los módulos (cambio global)
```

### Paso 3: Determinar si es cambio global

Si algún archivo pertenece a la sección "Cambios Globales" de `module-map.md`:
- Marcar `isGlobalChange: true`
- Incluir TODOS los módulos en el scope

### Paso 4: Escribir scope.json

Igual que el scope-analyzer, pero con información adicional del PR.

## Output: `context/scope.json`

```json
{
  "mode": "diff",
  "prNumber": 187,
  "prTitle": "Fix ad VAST validation on create",
  "baseBranch": "main",
  "headBranch": "feature/ads-vast-fix",
  "changedFiles": [
    "src/server/routes/ad/create.js",
    "views/ad.coffee"
  ],
  "isGlobalChange": false,
  "modules": ["ads"],
  "routes": ["/ad", "/ad/:ad_id"],
  "viewFiles": ["views/ad.coffee"],
  "specialist": "ads-specialist",
  "revenueImpact": true,
  "coverageThreshold": 80,
  "timestamp": "2026-05-22T10:00:00Z"
}
```

## Manejo de errores

- Si `gh` no está instalado: avisar al usuario que necesita `gh` CLI
- Si el PR no existe: mostrar el error de `gh` y pedir otro número
- Si no hay archivos que mapeen a módulos conocidos: informar al usuario que el PR no toca código auditado (puede ser solo documentación, CI config, etc.)

## Obtener contexto adicional del diff

Para que el siguiente agente (coverage-checker o feature-explorer) tenga contexto del cambio exacto:

```bash
gh pr diff <N>
```

Este output completo (no solo los nombres de archivo) se adjunta al scope.json como `diffContent` (primeros 10K chars).

```json
{
  "diffContent": "diff --git a/src/server/routes/ad/create.js...\n..."
}
```
