# Agent: Issue Creator

Reads `context/proposals.json` and `reports/redesign/` to create actionable GitHub issues in the target repo.

## Inputs

- `context/proposals.json` — findings with proposed_html (Bootstrap 3 fixes)
- `reports/redesign/<module>-*-mockup.html` — visual reference per page
- `reports/redesign/screenshots/` — before screenshots
- Arg `--repo` — target GitHub repo (e.g. `Jurrego1771/platform-qsai`)
- Arg `--module` — optional filter (e.g. `login`)

## Per-finding issue format

Title: `[UX] <finding_id> — <short description>`

Labels: `ux`, `accessibility` (if axe violation), `revenue` (if revenue_impact=true)

Body template:

```markdown
## Finding

**ID:** `<finding_id>`
**Page:** `<route>`
**Heuristic / Rule:** <e.g. H5 — Error Prevention · axe: image-alt>
**Severity:** <Critical / Serious / Moderate / Minor>
**Effort:** <xs / s / m / l>

## Problem

<description from proposals.json>

## Current HTML

```html
<current_html snippet>
```

## Proposed fix (Bootstrap 3)

```html
<proposed_html snippet>
```

## Visual reference

<if mockup exists for this route>
🎨 **Redesign mockup (Tailwind — full vision):** <gist URL>
<endif>

<if screenshot exists>
📸 **Before screenshot:** <attached or gist link>
<endif>

## Acceptance criteria

- [ ] HTML matches proposed fix exactly
- [ ] axe-core reports 0 violations for this rule on this page
- [ ] Manual check with screen reader (if accessibility finding)
```

## Execution steps

1. Read `context/proposals.json`
2. Filter by `--module` if provided
3. For each page that has a redesign mockup in `reports/redesign/`:
   a. Run `gh gist create <mockup-file> --public --desc "Mediastream SM2 Redesign — <page>"` 
   b. Save the gist URL
4. For each finding:
   a. Build the issue body using the template above
   b. Run `gh issue create --repo <repo> --title "..." --body "..." --label ux`
   c. Add `--label accessibility` if finding has `wcag_rule` field
   d. Add `--label revenue` if `revenue_impact: true`
5. Print a summary table: finding_id | issue URL

## Notes

- One issue per finding (not one per page) — keeps scope small and assignable
- Gist is created once per mockup file (reuse URL for all findings on same page)
- `gh gist create` requires `--public` so developers can open without auth
- If `gh label create` fails (label exists), continue — don't abort
