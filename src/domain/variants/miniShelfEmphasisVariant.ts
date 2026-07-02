import { normalizeLabelCode, getEncodedLabelCode, getMiniThreeRowDisplayParts } from '../labelCodeDisplay';
import { IComposedMiniLabel, IMiniCompositionVariant, IMiniTypographyFitResult, IMiniVariantGeometry } from '../../models/IMiniCompositionVariant';
import { ILabelLayoutStrategy } from '../../models/ILabelLayoutStrategy';
import { getMiniBarcodeTopFromTileTopMm } from '../../components/labelLayoutGeometry';
import { fitLineByWidth, getSecondaryCenterFromBarcodeTopMm } from '../miniCompositionVariantMath';

const MINI_SHELF_PRIMARY_FONT_WEIGHT = 900;
const MINI_SHELF_SECONDARY_FONT_WEIGHT = 700;
const MINI_SHELF_PRIMARY_MIN_MM = 13;
const MINI_SHELF_PRIMARY_MAX_MM = 19;
const MINI_SHELF_SECONDARY_MIN_MM = 4.6;
const MINI_SHELF_SECONDARY_MAX_MM = 5.6;
const MINI_SHELF_PRIMARY_CENTER_MM = 8.6;
const MINI_SHELF_SAFE_WIDTH_RATIO = 0.95;
const MINI_SHELF_SECONDARY_BOTTOM_PADDING_MM = 2;

const getShelfPrimaryText = (code: string): string => {
  const parts = getMiniThreeRowDisplayParts(code);
  return parts.bottom || parts.main;
};

const composeMiniShelfEmphasis = (code: string): IComposedMiniLabel => {
  const fullSpacedValue = normalizeLabelCode(code);

  return {
    variantId: 'mini-shelf-emphasis',
    primaryLineText: getShelfPrimaryText(code),
    secondaryLineText: fullSpacedValue,
    fullSpacedValue,
    encodedBarcodeValue: getEncodedLabelCode(code),
  };
};

const resolveMiniShelfEmphasisGeometry = (layoutStrategy: ILabelLayoutStrategy): IMiniVariantGeometry => {
  const barcodeTopFromContentTopMm =
    getMiniBarcodeTopFromTileTopMm(layoutStrategy) - layoutStrategy.typography.tilePaddingTopMm;

  return {
    primaryCenterFromContentTopMm: MINI_SHELF_PRIMARY_CENTER_MM,
    secondaryCenterFromContentTopMm: getSecondaryCenterFromBarcodeTopMm(
      barcodeTopFromContentTopMm,
      MINI_SHELF_SECONDARY_MAX_MM,
      MINI_SHELF_SECONDARY_BOTTOM_PADDING_MM,
    ),
    primaryMaxTextSizeMm: MINI_SHELF_PRIMARY_MAX_MM,
    secondaryMaxTextSizeMm: MINI_SHELF_SECONDARY_MAX_MM,
    barcodeTopFromTileTopMm: getMiniBarcodeTopFromTileTopMm(layoutStrategy),
  };
};

const fitMiniShelfEmphasisTypography = (
  composedLabel: IComposedMiniLabel,
  layoutStrategy: ILabelLayoutStrategy,
  geometry: IMiniVariantGeometry,
  measureText: (text: string, fontSizeMm: number, letterSpacingMm: number) => number,
): IMiniTypographyFitResult => {
  const availableWidthMm = (layoutStrategy.page.labelWidthMm - layoutStrategy.typography.tilePaddingHorizontalMm * 2)
    * MINI_SHELF_SAFE_WIDTH_RATIO;

  const primary = fitLineByWidth(
    composedLabel.primaryLineText,
    MINI_SHELF_PRIMARY_MIN_MM,
    Math.min(geometry.primaryMaxTextSizeMm, MINI_SHELF_PRIMARY_MAX_MM),
    availableWidthMm,
    layoutStrategy.typography.primaryLetterSpacingMm,
    measureText,
  );

  const secondary = fitLineByWidth(
    composedLabel.secondaryLineText,
    MINI_SHELF_SECONDARY_MIN_MM,
    Math.min(geometry.secondaryMaxTextSizeMm, MINI_SHELF_SECONDARY_MAX_MM),
    availableWidthMm,
    0,
    measureText,
  );

  const barcodeTopFromContentTopMm = geometry.barcodeTopFromTileTopMm - layoutStrategy.typography.tilePaddingTopMm;
  const secondaryCenterFromContentTopMm = getSecondaryCenterFromBarcodeTopMm(
    barcodeTopFromContentTopMm,
    secondary,
    MINI_SHELF_SECONDARY_BOTTOM_PADDING_MM,
  );

  return {
    primaryTextSizeMm: primary,
    secondaryTextSizeMm: secondary,
    secondaryCenterFromContentTopMm,
    primaryFontWeight: MINI_SHELF_PRIMARY_FONT_WEIGHT,
    secondaryFontWeight: MINI_SHELF_SECONDARY_FONT_WEIGHT,
  };
};

export const miniShelfEmphasisVariant: IMiniCompositionVariant = {
  id: 'mini-shelf-emphasis',
  composeLabel: composeMiniShelfEmphasis,
  resolveGeometry: resolveMiniShelfEmphasisGeometry,
  fitTypography: fitMiniShelfEmphasisTypography,
};
