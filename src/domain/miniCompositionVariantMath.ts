import { MiniTextMeasureFn } from '../models/IMiniCompositionVariant';

export const clampMm = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const fitLineByWidth = (
  text: string,
  minSizeMm: number,
  maxSizeMm: number,
  availableWidthMm: number,
  letterSpacingMm: number,
  measureText: MiniTextMeasureFn,
): number => {
  if (!text) {
    return maxSizeMm;
  }

  if (availableWidthMm <= 0) {
    return minSizeMm;
  }

  const measuredAtMax = measureText(text, maxSizeMm, letterSpacingMm);
  if (measuredAtMax <= availableWidthMm) {
    return maxSizeMm;
  }

  const firstPass = clampMm(maxSizeMm * (availableWidthMm / measuredAtMax), minSizeMm, maxSizeMm);
  const measuredAtFirstPass = measureText(text, firstPass, letterSpacingMm);
  if (measuredAtFirstPass <= 0) {
    return firstPass;
  }

  return clampMm(firstPass * (availableWidthMm / measuredAtFirstPass), minSizeMm, maxSizeMm);
};

export const getSecondaryCenterFromBarcodeTopMm = (
  barcodeTopFromContentTopMm: number,
  secondaryTextSizeMm: number,
  secondaryBottomPaddingMm: number,
): number => {
  return barcodeTopFromContentTopMm - secondaryBottomPaddingMm - secondaryTextSizeMm / 2;
};
