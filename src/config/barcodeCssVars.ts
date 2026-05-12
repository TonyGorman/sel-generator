import { IBarcodeGeometry, LabelPrintMode } from '../models/ILabelLayoutStrategy';

const toMmStyle = (value: number): string => `${value}mm`;

export const getBarcodeCssVarsForMode = (
  mode: LabelPrintMode,
  geometry: IBarcodeGeometry,
): Record<string, string> => {
  if (mode === 'large-sel') {
    return {
      '--large-sel-barcode-width-mm': toMmStyle(geometry.widthMm),
      '--large-sel-barcode-height-mm': toMmStyle(geometry.heightMm),
      '--large-sel-barcode-margin-bottom-mm': toMmStyle(geometry.marginBottomMm),
    };
  }

  return {
    '--mini-sel-barcode-width-mm': toMmStyle(geometry.widthMm),
    '--mini-sel-barcode-height-mm': toMmStyle(geometry.heightMm),
    '--mini-sel-barcode-margin-bottom-mm': toMmStyle(geometry.marginBottomMm),
  };
};
