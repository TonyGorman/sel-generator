# Agent Notes

## Project Priority
This tool is A4 print-first. The primary and non-negotiable use case is printing barcode labels on A4 stock.

## Measurement Rules
- Use millimeters (mm) only for all print geometry.
- Do not switch print sizing to px, rem, %, or any non-mm unit for label/page dimensions.
- Preserve mm-based layout and spacing when making changes.

## Canonical Label Geometry
- Label size: 39mm x 39mm.

## Canonical A4 Margin Geometry
- Left margin: 11mm.
- Right margin: 12mm.
- Top margin: 7.5mm.
- Bottom margin: 7.5mm.

## Implementation Guardrail
When changing barcode rendering, layout, or print styles, prioritize scan reliability and physical print accuracy over screen aesthetics.
