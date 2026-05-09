# Code Review Findings (2026-05-09)

This file preserves the full findings from the independent review so chat compaction does not lose them.

## 1) PDF export rasterizes barcodes, reducing scan reliability
- Severity: High
- Why it matters: Rasterization and image compression can soften barcode edges and impact scanner read rates.
- Files:
  - src/components/BarcodeGenerator.tsx
  - src/components/BarcodeTile.tsx
- Suggested direction: Prefer vector-first PDF output for barcodes. If raster export is required, keep quality profile conservative and run scan validation on printed labels.

## 2) Inconsistent page dimensions between print CSS and PDF generation
- Severity: High
- Why it matters: Dimension drift can create clipping or subtle scaling mismatches between print and downloaded PDF.
- Files:
  - src/components/Barcode.module.scss
  - src/components/BarcodeGenerator.tsx
- Suggested direction: Use one source of truth for sheet dimensions and consume it in both CSS and export code.

## 3) BAK flow accepts invalid/empty numeric input
- Severity: High
- Why it matters: Invalid ranges can create invalid labels or empty output with poor feedback.
- File:
  - src/components/BAKBarcode.tsx
- Suggested direction: Enforce integer input, bounds, start <= end, and clear error messages.

## 4) Specific barcode validation too weak
- Severity: Medium
- Why it matters: Length-only checks let malformed inputs pass and reject valid variants.
- Files:
  - src/components/SpecificBarcode.tsx
  - src/components/BarcodeTile.tsx
- Suggested direction: Validate against canonical supported formats with clear messaging.

## 5) Aisle flow can submit with no side ranges
- Severity: Medium
- Why it matters: Appears broken when generation returns empty output.
- File:
  - src/components/AisleBarcode.tsx
- Suggested direction: Require at least one complete side range.

## 6) Shelf token generation unbounded beyond alphabet range
- Severity: Medium
- Why it matters: Alphabetical shelf mode can diverge from expected display/token behavior after 26.
- Files:
  - src/config/barcodeConfig.ts
  - src/components/BarcodeTile.tsx
- Suggested direction: Keep shelf limits explicit or implement a consistent rollover scheme.

## 7) Pagination effect stale dependency risk
- Severity: Medium
- Why it matters: Page content may stale when source data changes.
- File:
  - src/components/Pagination.tsx
- Suggested direction: Include data in effect dependencies and clamp page index.

## 8) Optional config type mismatch
- Severity: Low
- Why it matters: Optional typing with non-null assertions weakens safety.
- Files:
  - src/models/IBarcodeGenerator.ts
  - src/components/BarcodeGenerator.tsx
- Suggested direction: Make config required in the model.

## 9) Debug logging and accessibility polish
- Severity: Low
- Why it matters: Console noise and limited status semantics reduce quality.
- Files:
  - src/components/BAKBarcode.tsx
  - src/components/SpecificBarcode.tsx
  - src/components/BarcodeGenerator.tsx
- Suggested direction: Remove debug logs and strengthen status/accessibility semantics.

## Review Plan Tracking
- Step 1 (dimension unification): completed.
- Step 2 (strict validation): completed.
- Step 3 (barcode-safe export path and validation guidance): in progress/completed incrementally.
