export type LabelPrintMode = 'mini-sel' | 'large-sel';
export type PageOrientation = 'landscape' | 'portrait';

export interface ILabelPageGeometry {
  sheetWidthMm: number;
  sheetHeightMm: number;
  orientation: PageOrientation;
  pagePadLeftMm: number;
  pagePadRightMm: number;
  pagePadTopMm: number;
  pagePadBottomMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  columns: number;
  rows: number;
}

export interface ILabelTypographyGeometry {
  primaryTextSizeMm: number;
  secondaryTextSizeMm: number;
  primaryLetterSpacingMm: number;
  primaryBaselineFromContentTopMm: number;
  secondaryBaselineFromContentTopMm: number;
  barcodeModuleThicknessMm: number;
  barcodeHeightMm: number;
  tilePaddingHorizontalMm: number;
  tilePaddingTopMm: number;
  tilePaddingBottomMm: number;
  largePrefixTextSizeMm: number;
  largeMainTextSizeMm: number;
  largeSuffixTextSizeMm: number;
}

export interface IBarcodeGeometry {
  widthMm: number;
  heightMm: number;
  marginBottomMm: number;
}

export interface ILabelLayoutStrategy {
  mode: LabelPrintMode;
  displayName: string;
  page: ILabelPageGeometry;
  typography: ILabelTypographyGeometry;
  barcodeGeometry: IBarcodeGeometry;
}
