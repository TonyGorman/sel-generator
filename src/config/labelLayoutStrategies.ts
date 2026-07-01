import { ILabelLayoutStrategy, LabelPrintMode, TileLayout } from '../models/ILabelLayoutStrategy';

class MiniSelLayoutStrategy implements ILabelLayoutStrategy {
  mode: LabelPrintMode = 'mini-sel';
  tileLayout: TileLayout = 'mini-stacked';

  displayName = 'Mini SEL';

  page = {
    sheetWidthMm: 296,
    sheetHeightMm: 210,
    orientation: 'landscape' as const,
    pagePadLeftMm: 11,
    pagePadRightMm: 12,
    pagePadTopMm: 7.5,
    pagePadBottomMm: 7.5,
    labelWidthMm: 39,
    labelHeightMm: 39,
    columns: 7,
    rows: 5,
  };

  typography = {
    primaryTextSizeMm: 12,
    primaryTextMinSizeMm: 6,
    primaryTextMaxSizeMm: 13,
    primaryAutoFitEnabled: true,
    secondaryTextSizeMm: 5.8,
    primaryLetterSpacingMm: 0.07,
    primaryCenterFromTileTopMm: 9.75,
    secondaryBaselineFromTileTopMm: 21.5,
    secondaryDomTopOffsetMm: 4.5,
    pdfTextBaselineOffsetFactor: 0.34,
    pdfEncodedTextBaselineOffsetFactor: 0.34,
    barcodeModuleThicknessMm: 0.23,
    barcodeHeightMm: 8,
    tilePaddingHorizontalMm: 1.2,
    tilePaddingTopMm: 1.5,
    tilePaddingBottomMm: 0.8,
    largePrefixTextSizeMm: 8,
    largeMainTextSizeMm: 12,
    largeSuffixTextSizeMm: 8,
  };

  barcodeGeometry = {
    widthMm: 37,
    heightMm: 8,
    marginBottomMm: 4,
  };
}

class LargeSelLayoutStrategy implements ILabelLayoutStrategy {
  mode: LabelPrintMode = 'large-sel';
  tileLayout: TileLayout = 'large-heading';

  displayName = 'Large SEL';

  page = {
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    orientation: 'portrait' as const,
    pagePadLeftMm: 0,
    pagePadRightMm: 0,
    pagePadTopMm: 0,
    pagePadBottomMm: 5,
    labelWidthMm: 105,
    labelHeightMm: 73,
    columns: 2,
    rows: 4,
  };

  typography = {
    primaryTextSizeMm: 12,
    primaryTextMinSizeMm: 12,
    primaryTextMaxSizeMm: 12,
    primaryAutoFitEnabled: false,
    secondaryTextSizeMm: 5.8,
    primaryLetterSpacingMm: 0.07,
    primaryCenterFromTileTopMm: 11.42,
    secondaryBaselineFromTileTopMm: 26.2,
    secondaryDomTopOffsetMm: 4.5,
    pdfTextBaselineOffsetFactor: 0.34,
    pdfEncodedTextBaselineOffsetFactor: 0.34,
    barcodeModuleThicknessMm: 0.51,
    barcodeHeightMm: 8,
    tilePaddingHorizontalMm: 4,
    tilePaddingTopMm: 4,
    tilePaddingBottomMm: 2,
    largePrefixTextSizeMm: 12,
    largeMainTextSizeMm: 24,
    largeSuffixTextSizeMm: 12,
  };

  barcodeGeometry = {
    widthMm: 37,
    heightMm: 8,
    marginBottomMm: 5,
  };
}

const miniSelLayoutStrategy = new MiniSelLayoutStrategy();
const largeSelLayoutStrategy = new LargeSelLayoutStrategy();

const strategyByMode = new Map<LabelPrintMode, ILabelLayoutStrategy>([
  ['mini-sel', miniSelLayoutStrategy],
  ['large-sel', largeSelLayoutStrategy],
]);

export const getLabelLayoutStrategy = (mode: LabelPrintMode): ILabelLayoutStrategy => {
  return strategyByMode.get(mode) ?? miniSelLayoutStrategy;
};

export const DEFAULT_LABEL_PRINT_MODE: LabelPrintMode = 'mini-sel';
