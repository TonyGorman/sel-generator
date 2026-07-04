import { ILabelLayoutStrategy } from '../models/ILabelLayoutStrategy';

const PRIMARY_TEXT_AVERAGE_GLYPH_WIDTH_FACTOR = 0.62;
const PRIMARY_TEXT_FIT_SAFETY_RATIO = 0.95;
const MINI_AISLE_AUX_TEXT_SIZE_MM = 6.8;
const MINI_AISLE_MAIN_MAX_TEXT_SIZE_MM = 9.2;
const MINI_AISLE_TOP_SAFE_GUTTER_MM = 1.2;
const MINI_AISLE_BOTTOM_SAFE_GUTTER_MM = 1.8;
const MINI_AISLE_MIN_ROW_GAP_MM = 2;

const clampMm = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const estimatePrimaryTextWidthMm = (text: string, fontSizeMm: number, letterSpacingMm: number): number => {
  if (!text) {
    return 0;
  }

  const glyphWidth = text.length * fontSizeMm * PRIMARY_TEXT_AVERAGE_GLYPH_WIDTH_FACTOR;
  const spacingWidth = Math.max(text.length - 1, 0) * letterSpacingMm;
  return glyphWidth + spacingWidth;
};

export type PrimaryTextMeasureFn = (text: string, fontSizeMm: number, letterSpacingMm: number) => number;

export const fitMiniPrimaryFontSizeMm = (
  primaryText: string,
  layoutStrategy: ILabelLayoutStrategy,
  measureTextWidth: PrimaryTextMeasureFn = estimatePrimaryTextWidthMm,
): number => {
  const { page, typography } = layoutStrategy;

  if (layoutStrategy.renderVariant !== 'small' || !typography.primaryAutoFitEnabled) {
    return typography.primaryTextMaxSizeMm;
  }

  const minSizeMm = typography.primaryTextMinSizeMm;
  const maxSizeMm = typography.primaryTextMaxSizeMm;
  if (!primaryText) {
    return maxSizeMm;
  }

  const availableWidthMm =
    (page.labelWidthMm - typography.tilePaddingHorizontalMm * 2) * PRIMARY_TEXT_FIT_SAFETY_RATIO;
  if (availableWidthMm <= 0) {
    return minSizeMm;
  }

  const measuredWidthAtMax = measureTextWidth(primaryText, maxSizeMm, typography.primaryLetterSpacingMm);
  if (measuredWidthAtMax <= availableWidthMm) {
    return maxSizeMm;
  }

  const proportionalFit = maxSizeMm * (availableWidthMm / measuredWidthAtMax);
  const firstPass = clampMm(proportionalFit, minSizeMm, maxSizeMm);

  const firstPassWidth = measureTextWidth(primaryText, firstPass, typography.primaryLetterSpacingMm);
  if (firstPassWidth <= 0) {
    return firstPass;
  }

  const refinedFit = firstPass * (availableWidthMm / firstPassWidth);
  return clampMm(refinedFit, minSizeMm, maxSizeMm);
};

export const getMiniBarcodeTopFromTileTopMm = (layoutStrategy: ILabelLayoutStrategy): number => {
  const { page, typography, barcodeGeometry } = layoutStrategy;
  return page.labelHeightMm - typography.tilePaddingBottomMm - barcodeGeometry.marginBottomMm - barcodeGeometry.heightMm;
};

export interface IMiniAisleThreeRowGeometry {
  topCenterFromContentTopMm: number;
  mainCenterFromContentTopMm: number;
  bottomCenterFromContentTopMm: number;
  auxTextSizeMm: number;
  mainMaxTextSizeMm: number;
}

export const getMiniAisleThreeRowGeometry = (layoutStrategy: ILabelLayoutStrategy): IMiniAisleThreeRowGeometry => {
  const barcodeTopFromTileTopMm = getMiniBarcodeTopFromTileTopMm(layoutStrategy);
  const availableHeightFromContentTopMm = barcodeTopFromTileTopMm - layoutStrategy.typography.tilePaddingTopMm;

  const auxHalfHeight = MINI_AISLE_AUX_TEXT_SIZE_MM / 2;
  let topCenter = MINI_AISLE_TOP_SAFE_GUTTER_MM + auxHalfHeight;
  let bottomCenter = availableHeightFromContentTopMm - MINI_AISLE_BOTTOM_SAFE_GUTTER_MM - auxHalfHeight;

  if (bottomCenter - topCenter < MINI_AISLE_MIN_ROW_GAP_MM * 2) {
    const middle = availableHeightFromContentTopMm / 2;
    topCenter = middle - MINI_AISLE_MIN_ROW_GAP_MM;
    bottomCenter = middle + MINI_AISLE_MIN_ROW_GAP_MM;
  }

  return {
    topCenterFromContentTopMm: topCenter,
    mainCenterFromContentTopMm: (topCenter + bottomCenter) / 2,
    bottomCenterFromContentTopMm: bottomCenter,
    auxTextSizeMm: MINI_AISLE_AUX_TEXT_SIZE_MM,
    mainMaxTextSizeMm: MINI_AISLE_MAIN_MAX_TEXT_SIZE_MM,
  };
};

export const getPdfBaselineFromCenterMm = (
  centerFromTileTopMm: number,
  fontSizeMm: number,
  baselineOffsetFactor: number,
): number => {
  return centerFromTileTopMm + fontSizeMm * baselineOffsetFactor;
};
