# barcode-generator

## Build and Publish

### Local setup

1. Install dependencies:
	`npm install`
2. Start the development server:
	`npm run dev`

### Production build

Generate a production-ready build with:

`npm run build`

The compiled output is written to `dist`.

### Publish

To publish this app, deploy the contents of `dist` using your preferred static hosting provider or web server.

Before publishing, validate the build locally if needed with:

`npm run preview`

### Publish on GitHub Pages

This repository includes a GitHub Actions workflow that builds and publishes to GitHub Pages on every push to `main`.

1. Push your latest changes to `main`.
2. In GitHub, open Settings > Pages.
3. Set Source to GitHub Actions.
4. Wait for the `Deploy to GitHub Pages` workflow to finish.

Your site will be available at your repository Pages URL.

## Print and Scan Validation Protocol

Use this protocol whenever PDF/export logic, barcode sizing, typography, or print styles are changed.

### Goal

Confirm generated labels remain machine-readable after:

- Browser preview
- PDF download
- Physical print

### Validation Inputs

Create at least one sample sheet from each flow:

- Aisle flow: low, mid, high values (for example 01, 50, 99) and multiple side ranges
- BAK flow: bay range and shelf range coverage
- Specific flow: all supported input styles (compact and dashed)

Include both shelf modes:

- numerical shelves
- alphabetical shelves

### Printer and Media Matrix

Run scans for each available combination:

- Printer type: thermal, laser, inkjet (as available)
- Scale: 100 percent only (no fit-to-page)
- Media: production label stock and plain office paper

### Scanner Matrix

Test with at least one scanner from each class available in store/ops:

- Fixed POS scanner
- Handheld laser scanner
- Handheld camera/imager scanner

### Pass/Fail Criteria

For every printed sample:

- First-attempt scan rate should be 100 percent in normal operator use
- No manual keying required
- No repeated rescans for the same label under normal lighting
- Human-readable text must match the scanned value

### Failure Triage Checklist

If scan quality drops:

- Confirm print dialog used 100 percent scale
- Compare on-screen preview vs downloaded PDF vs printed output
- Re-test PDF export and print path independently
- Verify barcode module width and quiet-zone spacing were not reduced
- Verify no additional PDF/image compression was introduced

### Regression Gate

Treat scan validation as a release gate for barcode-related changes. A change is not complete until:

- automated tests pass
- print-and-scan matrix pass is recorded by the validating owner