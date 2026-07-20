# TODO

## Completed

1. [x] Remove Download Labels as a full feature.
   - Removed UI wiring, PDF export stack, PDF-only dependencies, and download-only tests.
   - Print preview and `Print Labels` left intact.

2. [x] Enable TypeScript strict mode and consolidate duplicate helpers.
   - Turned on strict mode; resolved resulting type errors.
   - Consolidated `clampMm` and `hasValue` into shared utilities.

3. [x] Verify the project builds.
   - `npm run build` passes (typecheck + production bundle).

## Remaining

### 1. Release validation

The GitHub Pages deploy workflow runs only the `validate:ci` gate
(`audit:prod`, style checks, `test:run`, `build`). It does not run the
a11y or end-to-end suites. Before treating this work as fully shipped:

- [ ] 1.1 Run `npm run validate:release` locally to cover `test:a11y`
      and `test:e2e` in addition to the CI gate.
- [ ] 1.2 If any a11y or e2e assertion fails because of an intentional
      label/selector change, update the affected tests in the same
      change (per the Selector and Label Drift Rule).

### 2. Post-feature maintainability review

Per the AGENTS.md post-feature checklist, after implementation passes
the validation gates, do a proactive review pass:

- [ ] 2.1 Duplication detection: scan for identical constants, state
      patterns, or JSX blocks across files (e.g. `printModeOptions` in
      AisleLabelForm and SpecificLabelForm) and extract to shared hooks,
      components, or config constants.
- [ ] 2.2 Pattern recognition: consolidate common form patterns
      (RadioGroup, validation error display) and repeated validation
      logic where three or more instances exist.
- [ ] 2.3 Cognitive load: flag files doing too much and propose
      extracting custom hooks to reduce boilerplate where it clarifies
      behavior without creating harmful coupling.

### 3. Render-path verification

Applies only if label output may have changed. The recent work was
code-level (strict mode, helper consolidation), so this is a
confirm-no-regression pass:

- [ ] 3.1 Verify on-screen preview output is unchanged.
- [ ] 3.2 Verify print portal output is unchanged.

### 4. Visual regression check

Only required if UI output changed intentionally:

- [ ] 4.1 Run `npm run test:visual` to compare against baselines under
      `tests/e2e/label-regressions.spec.ts-snapshots`.
- [ ] 4.2 If changes are intentional and verified, update baselines with
      `npm run test:visual:update`, then run once with update mode and
      once without to confirm stability.
- [ ] 4.3 Keep the full-page 35 mini-label preview snapshot using the
      default configuration.
