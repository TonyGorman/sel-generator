import { ILabelLayoutStrategy, ILabelTypographyGeometry } from '../models/ILabelLayoutStrategy';

const PRIMARY_TEXT_AVERAGE_GLYPH_WIDTH_FACTOR = 0.62;
const PRIMARY_TEXT_FIT_SAFETY_RATIO = 0.95;

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

  if (layoutStrategy.mode !== 'mini-sel' || !typography.primaryAutoFitEnabled) {
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

export const getMiniPrimaryCenterFromContentTopMm = (typography: ILabelTypographyGeometry): number => {
  return typography.primaryCenterFromTileTopMm - typography.tilePaddingTopMm;
};

export const getMiniSecondaryTopFromContentTopMm = (typography: ILabelTypographyGeometry): number => {
  return typography.secondaryBaselineFromTileTopMm - typography.tilePaddingTopMm - typography.secondaryDomTopOffsetMm;
};

export const getMiniBarcodeTopFromTileTopMm = (layoutStrategy: ILabelLayoutStrategy): number => {
  const { page, typography, barcodeGeometry } = layoutStrategy;
  return page.labelHeightMm - typography.tilePaddingBottomMm - barcodeGeometry.marginBottomMm - barcodeGeometry.heightMm;
};

export const getPdfBaselineFromCenterMm = (
  centerFromTileTopMm: number,
  fontSizeMm: number,
  baselineOffsetFactor: number,
): number => {
  return centerFromTileTopMm + fontSizeMm * baselineOffsetFactor;
};
