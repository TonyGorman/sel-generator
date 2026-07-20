# TODO

Action items from the best-practices / engineering-quality code review, ordered by priority.

## High Priority (Critical Bugs / Performance)

- [ ] Fix `Pagination` render-phase `setCurrentPage` (`src/components/Pagination.tsx:12-14`): move clamping into `useEffect` or use a derived value pattern instead of syncing to state during render. *(Violates React rules, can cause hard-to-debug issues.)*
- [ ] Fix `useResetOnVariantChange` to skip the initial-mount invocation (`src/components/useResetOnVariantChange.ts:12-14`) using a ref guard. *(Currently fires `resetFn()` unnecessarily on mount.)*
- [ ] Memoize expensive `LabelTile` composition work: wrap expensive calls (`composeLabel`, `resolveGeometry`, `fitTypography`) with `useMemo` keyed on `code`, `layoutMode`, `miniVariantId`. *(Full-page 35-tile rendering is bottleneck; React.memo alone won't help due to new prop references.)*

## Medium Priority (Cleanup / Consolidation)

- [ ] Consolidate duplicated `clampMm` (`src/components/labelLayoutGeometry.ts:11`, `src/domain/miniCompositionVariantMath.ts:3`) into `src/domain/mathUtils.ts`.
- [ ] Cache regex patterns (`buildCompactConfiguredAisleCodePattern`, `buildCompactShortCodePattern`) rebuilt on every parse (`src/domain/labelCodeParser.ts:24`, `src/domain/labelCodePatterns.ts`) — cache in a `Map` by prefix or build once at module load.
- [ ] Pre-compute normalized `Set`s in `normalizeAllowedValue` (`src/config/labelConfig.ts:49-57`) once at module load for `AISLE_PREFIXES`, `SHORT_CODE_PREFIXES`, `SPECIAL_AISLE_VALUES`. *(Micro-optimization; low impact.)*
- [ ] Fix `getMiniThreeRowDisplayParts` normalizedCode inconsistency (`src/domain/labelCodeDisplay.ts:108-150`): pass `normalizedCode` to the parser or remove the redundant normalization.
- [ ] Decide on `labelCodeDomain.ts` barrel: rename to `index.ts` or update `AGENTS.md` to reflect that logic lives in `labelCodeDisplay.ts` / `labelCodeParser.ts`.
- [ ] `BackLabelForm` hardcoded `layoutMode="mini-sel"` (`src/components/BackLabelForm.tsx:173`): add a code comment explaining large-sel is unsupported due to scope. *(Do not add the radio group—back labels have weaker use case at scale.)*
- [ ] Add tests for `Pagination` state-sync edge cases (empty data, page-count shrinkage when `data.length` drops below current page).
- [ ] Add test coverage reflecting `useResetOnVariantChange` + `useLabelPrintMode` asymmetry across the 3 forms (only 2 of 3 use it).
- [ ] Verify `.githooks/pre-push` actually runs `validate:ci` / `validate:release` to prevent pushing broken code.

## Low Priority / Stylistic

- [ ] `Pagination`: use `Array.from({ length: totalPages })` instead of `[...Array(totalPages)]`; consider windowed page list if page counts can be large.
- [ ] For consistency, wrap `onInputChange` in `useCallback` in `SpecificLabelForm` and `BackLabelForm` (matches `AisleLabelForm`).
- [ ] Standardize component style: `React.FC<Props>` vs plain function declarations with explicit return types (`LabelApp`, `LabelTile`, `LabelGenerator` currently differ).
- [ ] Enable a semicolon rule in ESLint and run `lint:fix` (inconsistent semicolon usage in `SpecificLabelForm.tsx` / `BackLabelForm.tsx`).
- [ ] Remove domain re-exports from `LabelTile.tsx:62-66` (`normalizeLabelCode`, `getEncodedLabelCode`, `getLargeSelDisplayParts`); have consumers import from `labelCodeDomain` directly. *(First update test imports in `LabelTile.test.tsx` to import from `labelCodeDomain` instead.)*
- [ ] Use `MIN_BAY_VALUE` in `BackLabelForm` `bayRangeText` display string (`src/components/BackLabelForm.tsx:36`) instead of hardcoded `1-${MAX_BAY_VALUE}`.

## No action required (review confirmed acceptable)

- `RadioGroup` controlled `onChange` pattern (`src/components/FormControls.tsx:117`).
- `Tabs` `aria-controls` / `aria-labelledby` bidirectionality (`src/components/Tabs.tsx:77-96`).
- Print button emoji with `aria-hidden` + `aria-label` (`src/components/LabelGenerator.tsx:73`).
- Coverage excluding `labelCodeDomain.ts` re-export barrel (`vite.config.ts:67`).
