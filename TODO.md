# TODO

- [x] Remove Download Labels as a full feature.

  - Remove the UI wiring from `src/components/LabelGenerator.tsx`.
  - Delete the `Download Labels` button.
  - Remove the loading/error state that exists only for PDF export.
  - Keep print preview and `Print Labels` intact.

  - Delete the PDF export stack.
  - Remove `src/components/labelPdfExporter.ts`.
  - Remove `src/components/LabelPdfExport.ts`.
  - Remove `src/components/labelPdfExportError.ts`.
  - Remove any supporting helper paths that exist only for download.

  - Remove PDF-only dependencies from `package.json` if nothing else uses them.
  - `html2canvas`
  - `jsbarcode`
  - `jspdf`
  - `svg2pdf.js`

  - Delete or rewrite tests that only exist for download behavior.
  - `src/components/LabelGenerator.test.tsx`
  - `src/components/labelPdfExportService.test.ts`
  - `src/components/labelPdfExportService.dependencyFailure.test.ts`
  - `src/components/LabelPdfExport.test.ts`
  - `src/components/LabelPdfExport.shelfEmphasis.test.ts`
  - the download assertion in `tests/e2e/label-regressions.spec.ts`

  - Update docs and guardrails that describe PDF download.
  - `README.md`
  - `AGENTS.md`

  - Re-run release validation after the cut to confirm print/preview still work.

  Notes:
  - This should be treated as a full feature removal, not a hidden or disabled download action.
  - Print and preview use separate paths, so they should remain after the download stack is removed.
