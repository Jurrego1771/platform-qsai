# /create-issues — Crear GitHub Issues desde audit UX

## Propósito

Genera un GitHub issue por cada hallazgo en `context/proposals.json`, incluyendo:
- HTML actual vs propuesto (Bootstrap 3)
- Link al mockup Tailwind (via GitHub Gist) para replicar la UI exacta
- Screenshot "before" si existe
- Acceptance criteria claros

## Uso

```
/create-issues                          # usa el último audit, repo por defecto
/create-issues login                    # solo findings del módulo login
/create-issues login --repo owner/repo  # repo destino explícito
```

## Prerequisito

Requiere que `/qa-ux` haya corrido y exista `context/proposals.json`.
Opcionalmente, `/redesign-proposal` para incluir los mockup Gists.

## Pipeline

### Paso 1 — Verificar prerequisitos

- Leer `context/proposals.json` — si no existe, pedir al usuario correr `/qa-ux` primero
- Detectar repo destino:
  1. Si se pasa `--repo`, usarlo
  2. Si no, usar `gh repo view --json nameWithOwner -q .nameWithOwner` del working dir
  3. Si falla (no es un repo git), pedir al usuario especificar `--repo`

### Paso 2 — Crear labels si no existen

```bash
gh label create ux --repo <repo> --color "8E65D8" --description "UX/heuristic finding" 2>/dev/null || true
gh label create accessibility --repo <repo> --color "97D700" --description "WCAG/axe-core violation" 2>/dev/null || true
gh label create revenue --repo <repo> --color "d73a4a" --description "Revenue-impacting issue" 2>/dev/null || true
```

### Paso 3 — Subir mockups a Gist

Para cada archivo `reports/redesign/<module>-*-mockup.html`:
```bash
gh gist create <file> --public --desc "Mediastream SM2 Redesign — <page>"
```
Guardar el Gist URL mapeado por ruta.

### Paso 4 — Ejecutar Issue Creator

Seguir las instrucciones de `agents/shared/07-issue-creator.md`.

### Paso 5 — Resumen

Imprimir tabla:

```
| Finding ID | Página | Severidad | Issue URL |
|------------|--------|-----------|-----------|
| ...        | ...    | ...       | ...       |
```

Total issues creados: N

## Notas

- Los issues se crean en el repo especificado — verificar antes de ejecutar
- Los Gists son **públicos** — no incluir datos sensibles en los mockups
- Si un issue ya existe con el mismo título, `gh issue create` creará un duplicado — verificar con `gh issue list --label ux` antes si es necesario
