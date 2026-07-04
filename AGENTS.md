# AGENTS Guidance

## Core Objective

This project is A4 print-first. The primary and non-negotiable use case is printing shelf edge labels on A4 SEL paper for 39mm x 39mm mini labels and A4 SEL paper for 73mm x 105mm large labels.
This has to be millimeter perfect to ensure the labels fit within the perforated lines on the paper.
Protect physical label accuracy and scan reliability before making UI/UX changes.

## Non-Negotiable Geometry Rules

- Keep all label and page geometry in millimeters (mm).
- Do not convert print geometry to px/rem/%.
- Canonical values:
  - Mini-label: 39mm x 39mm
  - A4 margins: left 11mm, right 12mm, top 7.5mm, bottom 7.5mm
  - Large-label: 73mm x 105mm
  - A4 margins: left 0mm, right 0mm, top 0mm, bottom 5mm


## Rendering Path Awareness

- Screen preview and print portal use the same `LabelTile` render path.
- `LabelTile` dispatches to layout-specific rendering based on `layoutStrategy.renderVariant` (`'small'` or `'large'`), not `layoutStrategy.mode`.

## Label Safety Rules

- Preserve barcode module width/height and quiet-zone assumptions unless explicitly changing barcode spec.
- Avoid changes that visually look better on screen but risk print scan reliability.
- Validate scan-critical changes with real print output whenever possible.

## Barcode Encoding Rules

- **Only compact input is accepted** (no dashes or spaces in user input).
- Compact input (`01L01A`, `BR10L01A`, `BAK01A`, `KIOSK`) is parsed directly to constituent parts (aisle token, side, bay, shelf).
- Prefixed aisle tokens are allow-listed by configuration (default `BR`, `BL`, `FL`, `FR`) and their numeric suffix is validated against configured aisle min/max bounds.
- Shelf tokens are **alphabetical only** (`A`-`Z`) for aisle and short label codes.
- **Barcode payload is always compact**, identical to the input after uppercasing.
- Display text uses font size and weight for visual treatment only — this is a rendering concern, not an input format.
- Encoding logic lives in `src/domain/labelCodeDomain.ts`; `getEncodedLabelCode()` parses compact input and emits a `CompactLabelCode` branded payload (a `string` subtype that prevents accidental use of display-formatted codes as barcode values).
- Scanner reliability depends on compact, separator-free payloads.

## Validation Gates

- Fast local validation gate: `npm run validate:ci`
- `validate:ci` runs style typing, style audit, `test:run`, and `build:bundle`
- GitHub Pages deploy workflow quality gate: `validate:ci` checks plus `npm run audit:prod`
- Full release validation gate: `npm run validate:release`
- `validate:release` runs `validate:ci`, `npm run audit:prod`, `npm run test:a11y`, and `npm run test:e2e`
- Coverage remains available when needed: `npm run test:coverage`
- Visual regressions remain available when needed: `npm run test:visual`
- Update visual baselines only for intentional UI changes: `npm run test:visual:update`

## Skills Check Invocation

- For Copilot code reviews, explicitly request the `react-best-practices` skill.
- For testability/maintainability reviews, explicitly request the `code-review-quality` skill.
- Include all four parts in the prompt:
  - Skill: `react-best-practices`
  - Scope: files/folders to review
  - Evidence: `npm run validate:ci` or `npm run validate:release`
  - Output: findings first, ordered by severity, with file references
- For `code-review-quality`, keep the same structure but set Skill to `code-review-quality` and focus scope on test files and impacted source files.
- Preferred shortcut prompt: `Do a react-best-practices skills check, full repo, include validate:release, findings first.`
- Preferred test-review shortcut prompt: `Use code-review-quality to review tests in src/components and tests/e2e, include npm run validate:release, findings first with actionable fixes.`

## Visual Regression Scope

- Snapshot baselines live under `tests/e2e/label-regressions.spec.ts-snapshots`.
- Keep at least one full-page (35 mini-labels) preview snapshot using default configuration.

## Change Discipline

- Make minimal, targeted edits.
- Do not modify `node_modules`.
- Do not remove defensive branches just to improve coverage; add tests to cover them.
- If removing platform-specific references, remove only first-party references in repo files.

## React / TypeScript Approach

- Prefer function components with typed props interfaces; keep public prop contracts explicit and stable.
- Use CSS Modules with `.module.css` files and generated `.module.css.d.ts` typings; do not reintroduce `.module.scss` unless explicitly requested.
- Keep state as close as possible to where it is used, but lift shared configuration state to the nearest common parent.
- Use controlled inputs for form fields so generated label output is deterministic and testable.
- Preserve existing data flow: input components collect values, generator components produce code arrays, and rendering components display labels.
- Keep barcode formatting logic in pure helper functions where possible; avoid embedding formatting rules directly in JSX.
- Reuse existing render paths (`LabelTile` and `LabelGenerator`) instead of creating parallel render trees for similar output.
- Use `useMemo` and `useEffect` only when they clarify behavior or prevent real recomputation; avoid adding hook complexity without benefit.
- Preserve accessibility roles and labels used by tests (`tab`, `tabpanel`, `alert`, button names), and update tests if labels intentionally change.
- Prefer small, targeted constants for tunable rendering values (text size, offsets, label dimensions) instead of magic literals in loops.
- Keep TypeScript changes strict enough to catch regressions, but avoid broad refactors unless explicitly requested.

## Testing Expectations For React Changes

- For logic changes, add or update Vitest tests near the affected component/helper.
- For UI behavior changes, add or update Playwright assertions in `tests/e2e/label-regressions.spec.ts`.
- For visual/layout changes, update visual snapshots only when the change is intentional and verified.
- When fixing uncovered defensive branches, write realistic tests that exercise the branch rather than removing the guard.

## Decision Order

When tradeoffs are required, prioritize in this order:

1. Scan reliability and barcode readability
2. Physical print geometry accuracy
3. Preview/print parity
4. UX polish and visual refinements
5. Refactoring and code style improvements

## Selector and Label Drift Rule

- If tab text, button labels, heading labels, or alert text changes intentionally, update related E2E selectors/assertions in the same change.
- If visual output changes intentionally, update snapshot baselines in the same change.

## Render-Path Change Checklist

Before completing any change that affects label output, verify:

- On-screen preview output
- Print portal output

## Snapshot Discipline

- Update snapshots only for intentional UI changes.
- After updating snapshots, run visual tests once with snapshot update mode and once without update mode.
- Keep a short note in commit/PR context describing why snapshot changes were expected.

## Accessibility Guardrail

- Preserve accessible roles and names for key controls and regions (tabs, tabpanels, alerts, primary action buttons) unless the change is explicitly intentional.
- If accessibility labels are changed intentionally, update associated tests in the same change.

## Test Determinism Rules

- Avoid introducing randomness into snapshot-producing tests.
- Avoid assertions that depend on current timestamps, unstable ordering, or environment-specific variability unless normalized.
- Normalize dynamic outputs before snapshotting when possible.

## Performance Guardrail

- Avoid expensive per-item work inside render loops over label tiles unless required.
- Prefer precomputed values and memoization when repeated calculations affect full-page barcode rendering.

## Documentation Sync Rule

- If test scripts, build commands, or deployment workflow changes, update `README.md` in the same change.
- Keep `.module.css.d.ts` files in sync with style class changes using `npm run styles:types`.
- Keep deployment quality gating aligned with `.github/workflows/deploy-pages.yml` (`npm run audit:prod`, style checks, unit tests, and build must pass before deploy).
